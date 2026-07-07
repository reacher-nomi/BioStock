import { router } from "expo-router";
import axios from "axios";
import { Platform } from "react-native";

import { clearSession, getAccessToken, getRefreshToken, saveSession } from "./session";

// Resolve the API base URL:
// - explicit override wins (EXPO_PUBLIC_API_URL)
// - web: "" (relative / same-origin) — the API serves the web build, so calls
//   go to the same host. This is what makes Codespaces work (one forwarded port).
// - Android emulator: host machine via 10.0.2.2
// - everything else (iOS sim, etc.): localhost
function resolveBaseURL() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "web") return "";
  if (Platform.OS === "android") return "http://10.0.2.2:8000";
  return "http://localhost:8000";
}

const baseURL = resolveBaseURL();

const api = axios.create({
  baseURL,
  timeout: 10000
});

// Auth endpoints are never worth retrying/refreshing against — a 401 there
// means "wrong credentials" or "invalid refresh token", not "expired session".
const isAuthEndpoint = (url) => !!url && /\/auth\/(login|register|refresh)\b/.test(url);

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Circuit breaker ---------------------------------------------------------
// After repeated transient failures the breaker "opens" and fails fast for a
// cooldown, so the app degrades gracefully instead of hammering a dead backend.
const FAILURE_THRESHOLD = 4;
const COOLDOWN_MS = 10000;
const breaker = { failures: 0, openUntil: 0 };

function recordSuccess() { breaker.failures = 0; breaker.openUntil = 0; }
function recordFailure() {
  breaker.failures += 1;
  if (breaker.failures >= FAILURE_THRESHOLD) {
    breaker.openUntil = Date.now() + COOLDOWN_MS;
  }
}
function circuitOpen() { return Date.now() < breaker.openUntil; }

api.interceptors.request.use((config) => {
  if (circuitOpen()) {
    return Promise.reject(new Error("Service temporarily unavailable. Please retry shortly."));
  }
  return config;
});

// --- Session refresh on 401 --------------------------------------------------
// A single in-flight refresh is shared across concurrent 401s so a burst of
// requests doesn't fire multiple refresh calls (and multiple rotations racing
// each other, which would invalidate one another's refresh token).
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh_token = await getRefreshToken();
      if (!refresh_token) throw new Error("No refresh token available");
      // Plain axios call, not `api` — must not go through these same interceptors.
      const res = await axios.post(`${baseURL}/auth/refresh`, { refresh_token });
      await saveSession(res.data);
      return res.data.access_token;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function endSessionAndRedirect() {
  await clearSession();
  router.replace("/(auth)/login");
}

// Fault tolerance: retry transient failures (network errors / 5xx) up to
// 3 times with exponential backoff (300ms, 600ms, 1200ms). 4xx are not retried.
const MAX_RETRIES = 3;

api.interceptors.response.use(
  (response) => { recordSuccess(); return response; },
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const status = error.response?.status;

    // Expired/invalid access token: refresh once and retry the original call.
    if (status === 401 && !config._retriedAuth && !isAuthEndpoint(config.url)) {
      config._retriedAuth = true;
      try {
        const newAccessToken = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(config);
      } catch {
        await endSessionAndRedirect();
        return Promise.reject(error);
      }
    }

    const isTransient = status === undefined || status >= 500;
    config._retryCount = config._retryCount || 0;

    if (!isTransient) { recordSuccess(); return Promise.reject(error); }

    if (config._retryCount >= MAX_RETRIES) {
      recordFailure();
      return Promise.reject(error);
    }

    config._retryCount += 1;
    const delay = 300 * 2 ** (config._retryCount - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return api(config);
  }
);

export default api;
