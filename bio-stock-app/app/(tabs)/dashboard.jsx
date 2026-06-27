import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import api from "../../utils/api";

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const router = useRouter();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/");
      setData(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const logout = async () => {
    await AsyncStorage.removeItem("access_token");
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.card}>
        <Text>Token Balance</Text>
        <Text style={styles.value}>{data?.token_balance ?? 0}</Text>
      </View>
      <View style={styles.card}>
        <Text>Current Streak</Text>
        <Text style={styles.value}>{data?.current_streak ?? 0}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f9fafb", minHeight: "100%" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#eee" },
  value: { fontSize: 28, fontWeight: "700", marginTop: 6 },
  button: { backgroundColor: "#10b981", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#dc2626", marginBottom: 12 }
});
