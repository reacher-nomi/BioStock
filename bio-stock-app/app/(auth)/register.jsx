import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

import { Backdrop, GlassCard } from "../../components/Glass";
import api from "../../utils/api";
import { apiErrorMessage, passwordProblem } from "../../utils/errors";
import { colors, font, radius, space } from "../../utils/theme";

const strength = (pw) => {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) s++;
  if (pw.length >= 12 || /[^a-zA-Z0-9]/.test(pw)) s++;
  return [{ label: "Weak", color: colors.red }, { label: "Okay", color: colors.yellow }, { label: "Strong", color: colors.green }][Math.max(0, s - 1)];
};

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!email) { setError("Enter your email."); return; }
    const pwProblem = passwordProblem(password);
    if (pwProblem) { setError(pwProblem); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      const response = await api.post("/auth/register", { email, password });
      await AsyncStorage.setItem("access_token", response.data.access_token);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = strength(password);

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start staking on your health.</Text>

        <GlassCard glow accent={colors.lime} style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor={colors.textFaint}
            autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <TextInput style={styles.input} placeholder="8+ chars, letters and numbers" placeholderTextColor={colors.textFaint}
            secureTextEntry value={password} onChangeText={setPassword} />
          {pwStrength && (
            <View style={styles.strengthRow}>
              <View style={[styles.strengthDot, { backgroundColor: pwStrength.color }]} />
              <Text style={[styles.strengthText, { color: pwStrength.color }]}>{pwStrength.label} password</Text>
            </View>
          )}

          <Text style={[styles.label, { marginTop: 14 }]}>Confirm Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.textFaint}
            secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Register</Text>}
          </TouchableOpacity>
        </GlassCard>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkAccent}>Sign in</Text></Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: space.lg },
  title: { color: colors.white, fontSize: font.h1, fontWeight: "900", textAlign: "center" },
  subtitle: { color: colors.textMuted, fontSize: font.body, textAlign: "center", marginTop: 6, marginBottom: space.xl },
  card: { marginBottom: space.lg },
  label: { color: colors.textMuted, fontSize: font.small, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.stroke, borderRadius: radius.sm, padding: 14, color: colors.white, fontSize: font.body },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  strengthDot: { width: 8, height: 8, borderRadius: 4 },
  strengthText: { fontSize: font.tiny, fontWeight: "700" },
  error: { color: colors.red, fontSize: font.small, marginTop: 12, textAlign: "center" },
  button: { backgroundColor: colors.lime, borderRadius: radius.md, padding: 16, alignItems: "center", marginTop: 20 },
  buttonText: { color: colors.bg, fontWeight: "900", fontSize: font.body },
  link: { color: colors.textMuted, textAlign: "center", fontSize: font.body },
  linkAccent: { color: colors.cyan, fontWeight: "700" },
});
