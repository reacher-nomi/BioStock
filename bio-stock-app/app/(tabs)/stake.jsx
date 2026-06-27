import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

import { Backdrop, GlassCard } from "../../components/Glass";
import api from "../../utils/api";
import { colors, font, radius, space } from "../../utils/theme";
import { showToast } from "../../utils/toast";

const PRESETS = [10, 25, 50, 100];
const statusColor = (s) => ({ ACTIVE: colors.cyan, SUCCESS: colors.green, FAILED: colors.red }[s] || colors.textFaint);

export default function StakeScreen() {
  const [goalName, setGoalName] = useState("7-Day Green Streak");
  const [stakeAmount, setStakeAmount] = useState("25");
  const [balance, setBalance] = useState(0);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bal, g] = await Promise.all([api.get("/tokens/balance"), api.get("/tokens/goals")]);
      setBalance(bal.data.balance);
      setGoals(g.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load");
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const stake = async () => {
    try {
      setError(""); setLoading(true);
      await api.post("/tokens/stake", { goal_name: goalName, stake_amount: Number(stakeAmount) });
      showToast(`Locked ${stakeAmount} HT on "${goalName}"`);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Staking failed");
    } finally {
      setLoading(false);
    }
  };

  const insufficient = Number(stakeAmount) > balance;

  return (
    <Backdrop>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>COMMITMENT POOL</Text>
        <Text style={styles.title}>Stake on Yourself</Text>

        <GlassCard glow accent={colors.cyan} style={styles.balanceCard}>
          <Text style={styles.cardLabel}>AVAILABLE TO STAKE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>{balance}</Text>
            <Text style={styles.balanceUnit}>HT</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.formCard}>
          <Text style={styles.fieldLabel}>Goal</Text>
          <TextInput style={styles.textInput} value={goalName} onChangeText={setGoalName}
            placeholderTextColor={colors.textFaint} />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Stake Amount</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <TouchableOpacity key={p}
                style={[styles.chip, Number(stakeAmount) === p && styles.chipActive]}
                onPress={() => setStakeAmount(String(p))}>
                <Text style={[styles.chipText, Number(stakeAmount) === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.textInput} value={stakeAmount} onChangeText={setStakeAmount}
            keyboardType="numeric" placeholderTextColor={colors.textFaint} />
        </GlassCard>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.button, insufficient && styles.buttonDisabled]}
          onPress={stake} disabled={insufficient || loading}>
          {loading ? <ActivityIndicator color={colors.bg} /> : (
            <Text style={styles.buttonText}>{insufficient ? "Insufficient Balance" : `Lock ${stakeAmount} HT`}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Stakes</Text>
        {goals.length === 0 ? (
          <Text style={styles.empty}>No stakes yet. Commit tokens to a goal above.</Text>
        ) : (
          goals.map((g) => (
            <GlassCard key={g.id} style={styles.goalCard}>
              <View style={styles.goalTop}>
                <Text style={styles.goalName}>{g.goal_name}</Text>
                <View style={[styles.statusBadge, { borderColor: statusColor(g.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(g.status) }]}>{g.status}</Text>
                </View>
              </View>
              <View style={styles.goalBottom}>
                <Text style={styles.goalStake}>{g.stake_amount} HT staked</Text>
                {g.status === "ACTIVE" && <Text style={styles.goalDays}>{g.days_remaining}d left</Text>}
              </View>
            </GlassCard>
          ))
        )}
        <View style={{ height: 90 }} />
      </ScrollView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.md, paddingTop: 60 },
  eyebrow: { color: colors.cyan, fontSize: font.tiny, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "900", marginTop: 4, marginBottom: space.lg },

  balanceCard: { marginBottom: space.md },
  cardLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", letterSpacing: 1.5 },
  balanceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 8 },
  balance: { color: colors.white, fontSize: 44, fontWeight: "900", lineHeight: 46 },
  balanceUnit: { color: colors.cyan, fontSize: font.h3, fontWeight: "800", marginLeft: 8, marginBottom: 6 },

  formCard: { marginBottom: space.md },
  fieldLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: "700", marginBottom: 8 },
  textInput: { backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.stroke, borderRadius: radius.sm, padding: 14, color: colors.white, fontSize: font.body, fontWeight: "600" },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  chipText: { color: colors.textMuted, fontWeight: "800" },
  chipTextActive: { color: colors.bg },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: space.md },
  error: { color: colors.red, fontSize: font.small },

  button: { backgroundColor: colors.lime, borderRadius: radius.md, padding: 16, alignItems: "center", marginBottom: space.xl },
  buttonDisabled: { backgroundColor: colors.surfaceStrong },
  buttonText: { color: colors.bg, fontWeight: "900", fontSize: font.body },

  sectionTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800", marginBottom: 12 },
  empty: { color: colors.textFaint, fontSize: font.small },
  goalCard: { marginBottom: 10, padding: 16 },
  goalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalName: { color: colors.text, fontSize: font.body, fontWeight: "700", flex: 1 },
  statusBadge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: font.tiny, fontWeight: "800" },
  goalBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  goalStake: { color: colors.lime, fontSize: font.small, fontWeight: "700" },
  goalDays: { color: colors.textFaint, fontSize: font.small },
});
