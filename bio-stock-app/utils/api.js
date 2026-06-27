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

export default api;
