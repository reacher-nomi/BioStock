import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// Use 10.0.2.2 for Android Emulator to connect to host machine's localhost
const baseURL = Platform.OS === "android"
  ? "http://10.0.2.2:8000"
  : "http://localhost:8000";

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
