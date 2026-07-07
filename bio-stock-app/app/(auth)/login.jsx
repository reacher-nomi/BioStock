import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

import { Backdrop, GlassCard } from "../../components/Glass";
import api from "../../utils/api";
import { apiErrorMessage } from "../../utils/errors";
import { saveSession } from "../../utils/session";
import { colors, font, radius, space } from "../../utils/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const login = async (emailValue, passwordValue) => {
    if (!emailValue || !passwordValue) { setError("Enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const response = await api.post("/auth/login", { email: emailValue, password: passwordValue });
      await saveSession(response.data);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => login(email, password);
  const handleDemo = () => { setEmail("test@test.com"); setPassword("password"); login("test@test.com", "password"); };

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
          <Text style={styles.label} nativeID="loginEmailLabel">Email</Text>
          <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor={colors.textFaint}
            autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
            accessibilityLabel="Email" accessibilityLabelledBy="loginEmailLabel" />

          <Text style={[styles.label, { marginTop: 14 }]} nativeID="loginPasswordLabel">Password</Text>
          <View style={styles.passwordRow}>
            <TextInput style={styles.passwordInput} placeholder="••••••••" placeholderTextColor={colors.textFaint}
              secureTextEntry={!showPassword} value={password} onChangeText={setPassword}
              accessibilityLabel="Password" accessibilityLabelledBy="loginPasswordLabel" />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}
              accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}
            accessibilityRole="button" accessibilityLabel="Sign in" accessibilityState={{ disabled: loading, busy: loading }}>
            {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDemo} disabled={loading} style={styles.demoBtn}
            accessibilityRole="button" accessibilityLabel="Try the demo account">
            <Text style={styles.demoText}>Try the demo account</Text>
          </TouchableOpacity>
        </GlassCard>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}
          accessibilityRole="link" accessibilityLabel="Create an account">
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
  passwordRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.stroke, borderRadius: radius.sm },
  passwordInput: { flex: 1, padding: 14, color: colors.white, fontSize: font.body },
  eyeBtn: { padding: 14 },
  error: { color: colors.red, fontSize: font.small, marginTop: 12, textAlign: "center" },
  button: { backgroundColor: colors.cyan, borderRadius: radius.md, padding: 16, alignItems: "center", marginTop: 20 },
  buttonText: { color: colors.bg, fontWeight: "900", fontSize: font.body },
  demoBtn: { alignItems: "center", marginTop: 14 },
  demoText: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },

  link: { color: colors.textMuted, textAlign: "center", fontSize: font.body },
  linkAccent: { color: colors.lime, fontWeight: "700" },
});
