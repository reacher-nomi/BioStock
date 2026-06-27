import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

import { Backdrop, GlassCard } from "../../components/Glass";
import api from "../../utils/api";
import { colors, font, radius, space } from "../../utils/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      const response = await api.post("/auth/login", { email, password });
      await AsyncStorage.setItem("access_token", response.data.access_token);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <View style={styles.brandWrap}>
          <View style={styles.logoBadge}>
            <Ionicons name="pulse" size={28} color={colors.bg} />
          </View>
          <Text style={styles.brand}>Bio-Stock</Text>
          <Text style={styles.tagline}>Decentralized Behavioral Health</Text>
        </View>

        <GlassCard glow accent={colors.cyan} style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor={colors.textFaint}
            autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.textFaint}
            secureTextEntry value={password} onChangeText={setPassword} />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </GlassCard>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.link}>New here? <Text style={styles.linkAccent}>Create an account</Text></Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: space.lg },
  brandWrap: { alignItems: "center", marginBottom: space.xl },
  logoBadge: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.cyan, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  brand: { color: colors.white, fontSize: 36, fontWeight: "900" },
  tagline: { color: colors.cyan, fontSize: font.small, fontWeight: "600", marginTop: 4, letterSpacing: 0.5 },

  card: { marginBottom: space.lg },
  label: { color: colors.textMuted, fontSize: font.small, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.stroke, borderRadius: radius.sm, padding: 14, color: colors.white, fontSize: font.body },
  error: { color: colors.red, fontSize: font.small, marginTop: 12, textAlign: "center" },
  button: { backgroundColor: colors.cyan, borderRadius: radius.md, padding: 16, alignItems: "center", marginTop: 20 },
  buttonText: { color: colors.bg, fontWeight: "900", fontSize: font.body },

  link: { color: colors.textMuted, textAlign: "center", fontSize: font.body },
  linkAccent: { color: colors.lime, fontWeight: "700" },
});
