import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// Allow an explicit override (used by the web/Docker build); otherwise use
// 10.0.2.2 for the Android emulator and localhost everywhere else.
const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000");

const api = axios.create({
  baseURL,
  timeout: 10000
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fault tolerance: retry transient failures (network errors / 5xx) up to
// 3 times with exponential backoff (300ms, 600ms, 1200ms). 4xx are not retried.
const MAX_RETRIES = 3;

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  if (!config) return Promise.reject(error);

  const status = error.response?.status;
  const isTransient = status === undefined || status >= 500;
  config._retryCount = config._retryCount || 0;

  if (!isTransient || config._retryCount >= MAX_RETRIES) {
    return Promise.reject(error);
  }

  config._retryCount += 1;
  const delay = 300 * 2 ** (config._retryCount - 1);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return api(config);
});

export default api;
