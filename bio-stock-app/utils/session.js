import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

// Persists both tokens returned by /auth/register, /auth/login, or /auth/refresh.
export async function saveSession({ access_token, refresh_token }) {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, access_token ?? ""],
    [REFRESH_KEY, refresh_token ?? ""],
  ]);
}

export function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}
