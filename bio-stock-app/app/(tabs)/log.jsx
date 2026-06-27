import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

import { Backdrop, GlassCard } from "../../components/Glass";
import api from "../../utils/api";
import { colors, font, radius, space, zoneColor } from "../../utils/theme";
import { showToast } from "../../utils/toast";

const FIELDS = [
  { key: "systolic_bp", label: "Systolic BP", unit: "mmHg", icon: "heart", placeholder: "110" },
  { key: "diastolic_bp", label: "Diastolic BP", unit: "mmHg", icon: "heart-half", placeholder: "70" },
  { key: "steps", label: "Steps", unit: "steps", icon: "walk", placeholder: "8000" },
  { key: "sleep_hours", label: "Sleep", unit: "hours", icon: "moon", placeholder: "8" },
  { key: "resting_hr", label: "Resting HR", unit: "bpm", icon: "pulse", placeholder: "60" },
];

export default function LogScreen() {
  const [form, setForm] = useState({ systolic_bp: "", diastolic_bp: "", steps: "", sleep_hours: "", resting_hr: "" });
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const filled = Object.values(form).every((v) => v !== "");

  const onSubmit = async () => {
    try {
      setError(""); setResult(null); setLoading(true);
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)]));
      const res = await api.post("/health/log", payload);
      setResult(res.data);
      showToast(`${res.data.zone.toUpperCase()} zone · +${res.data.tokens_earned} HT`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>DAILY CHECK-IN</Text>
          <Text style={styles.title}>Log Your Biometrics</Text>
          <Text style={styles.subtitle}>Stay in the green zone to mint Health Tokens.</Text>

          <GlassCard style={styles.formCard}>
            {FIELDS.map((f) => (
              <View key={f.key} style={styles.field}>
                <View style={styles.iconBox}>
                  <Ionicons name={f.icon} size={18} color={colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numeric"
                  value={form[f.key]}
                  onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                />
                <Text style={styles.unit}>{f.unit}</Text>
              </View>
            ))}
          </GlassCard>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.red} />
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          {result && (
            <GlassCard glow accent={zoneColor(result.zone)} style={styles.resultCard}>
              <Text style={[styles.resultZone, { color: zoneColor(result.zone) }]}>
                {result.zone.toUpperCase()} ZONE
              </Text>
              <Text style={styles.resultTokens}>+{result.tokens_earned} HT minted</Text>
              <Text style={styles.resultCompliance}>{result.compliance_rate}% compliance</Text>
              {result.delta_bonus > 0 && (
                <Text style={styles.resultDelta}>⚡ +{result.delta_bonus} HT improvement bonus</Text>
              )}
            </GlassCard>
          )}

          <TouchableOpacity
            style={[styles.button, !filled && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={!filled || loading}
          >
            {loading ? <ActivityIndicator color={colors.bg} /> : (
              <Text style={styles.buttonText}>Submit & Mint Tokens</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 90 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.md, paddingTop: 60 },
  eyebrow: { color: colors.cyan, fontSize: font.tiny, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "900", marginTop: 4 },
  subtitle: { color: colors.textMuted, fontSize: font.body, marginTop: 6, marginBottom: space.lg },

  formCard: { marginBottom: space.md },
  field: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.stroke },
  iconBox: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceStrong, alignItems: "center", justifyContent: "center", marginRight: 12 },
  fieldLabel: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  input: { color: colors.white, fontSize: font.h3, fontWeight: "800", textAlign: "right", minWidth: 70, padding: 0 },
  unit: { color: colors.textFaint, fontSize: font.tiny, width: 44, textAlign: "right" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: space.md },
  error: { color: colors.red, fontSize: font.small },

  resultCard: { marginBottom: space.md, alignItems: "center" },
  resultZone: { fontSize: font.h2, fontWeight: "900", letterSpacing: 1 },
  resultTokens: { color: colors.lime, fontSize: font.h3, fontWeight: "800", marginTop: 6 },
  resultCompliance: { color: colors.textMuted, fontSize: font.small, marginTop: 4 },
  resultDelta: { color: colors.lime, fontSize: font.small, fontWeight: "700", marginTop: 8 },

  button: { backgroundColor: colors.cyan, borderRadius: radius.md, padding: 16, alignItems: "center" },
  buttonDisabled: { backgroundColor: colors.cyanDim, opacity: 0.5 },
  buttonText: { color: colors.bg, fontWeight: "900", fontSize: font.body },
});
