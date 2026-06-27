import { Alert, Platform, ToastAndroid } from "react-native";

// Lightweight cross-platform toast. Uses the native Android toast on Android
// (the demo target) and falls back to an Alert elsewhere.
export function showToast(message) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("", message);
  }
}
