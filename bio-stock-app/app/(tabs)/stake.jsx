import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import api from "../../utils/api";

export default function StakeScreen() {
  const [goalName, setGoalName] = useState("7-day Green Zone");
  const [stakeAmount, setStakeAmount] = useState("10");
  const [balance, setBalance] = useState(0);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const bal = await api.get("/tokens/balance");
    const g = await api.get("/tokens/goals");
    setBalance(bal.data.balance);
    setGoals(g.data);
  };

  useEffect(() => {
    load();
  }, []);

  const stake = async () => {
    try {
      setError("");
      await api.post("/tokens/stake", { goal_name: goalName, stake_amount: Number(stakeAmount) });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Staking failed");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.balance}>Balance: {balance} HT</Text>
      <TextInput style={styles.input} value={goalName} onChangeText={setGoalName} />
      <TextInput style={styles.input} value={stakeAmount} onChangeText={setStakeAmount} keyboardType="numeric" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={stake}>
        <Text style={styles.buttonText}>Stake</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 16 }}>
        {goals.map((g) => (
          <View key={g.id} style={styles.goal}>
            <Text>{g.goal_name}</Text>
            <Text>{g.stake_amount} HT</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f9fafb", minHeight: "100%" },
  balance: { fontWeight: "700", fontSize: 20, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: "#fff" },
  button: { backgroundColor: "#10b981", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  goal: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 12, marginBottom: 8 },
  error: { color: "#dc2626", marginBottom: 8 }
});
