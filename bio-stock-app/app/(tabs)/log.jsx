import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";

import api from "../../utils/api";

export default function LogScreen() {
  const [form, setForm] = useState({
    systolic_bp: "",
    diastolic_bp: "",
    steps: "",
    sleep_hours: "",
    resting_hr: ""
  });
  const [error, setError] = useState("");

  const onSubmit = async () => {
    try {
      setError("");
      const payload = {
        systolic_bp: Number(form.systolic_bp),
        diastolic_bp: Number(form.diastolic_bp),
        steps: Number(form.steps),
        sleep_hours: Number(form.sleep_hours),
        resting_hr: Number(form.resting_hr)
      };
      const res = await api.post("/health/log", payload);
      Alert.alert("Logged", `Zone: ${res.data.zone.toUpperCase()} | Tokens: ${res.data.tokens_earned}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Object.keys(form).map((k) => (
        <TextInput
          key={k}
          style={styles.input}
          placeholder={k}
          keyboardType="numeric"
          value={form[k]}
          onChangeText={(v) => setForm((prev) => ({ ...prev, [k]: v }))}
        />
      ))}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f9fafb", minHeight: "100%" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: "#fff" },
  button: { backgroundColor: "#10b981", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#dc2626", marginBottom: 8 }
});
