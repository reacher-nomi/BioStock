import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AreaChart, Donut } from "../../components/Charts";
import { Backdrop, GlassCard } from "../../components/Glass";
import api from "../../utils/api";
import { colors, font, radius, space } from "../../utils/theme";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const METRIC_LABELS = { systolic_bp: "Systolic", diastolic_bp: "Diastolic", resting_hr: "Resting HR" };

export default function PortfolioScreen() {
  const [range, setRange] = useState(30);
  const [history, setHistory] = useState([]);
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (days) => {
    try {
      const [h, g, p] = await Promise.all([
        api.get(`/health/history?days=${days}`),
        api.get("/tokens/goals"),
        api.get("/health/progress"),
      ]);
      setHistory(h.data);
      setGoals(g.data);
      setProgress(p.data);
    } catch (e) { /* keep last good state */ }
    finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(range); }, [load, range]));

  // Derived metrics
  const totalEarned = history.reduce((s, h) => s + (h.tokens_earned || 0), 0);
  const cumulative = history.reduce((acc, h) => {
    acc.push((acc[acc.length - 1] || 0) + (h.tokens_earned || 0));
    return acc;
  }, []);
  const zoneCounts = history.reduce((acc, h) => {
    const z = (h.zone || "").toLowerCase();
    acc[z] = (acc[z] || 0) + 1;
    return acc;
  }, {});
  const resolved = goals.filter((g) => g.status === "SUCCESS" || g.status === "FAILED");
  const successRate = resolved.length
    ? Math.round((goals.filter((g) => g.status === "SUCCESS").length / resolved.length) * 100)
    : null;
  const totalStaked = goals.reduce((s, g) => s + (g.stake_amount || 0), 0);

  return (
    <Backdrop>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(range); }} tintColor={colors.cyan} />}
      >
        <Text style={styles.eyebrow}>YOUR PORTFOLIO</Text>
        <Text style={styles.title}>Health Performance</Text>

        {/* Range toggle */}
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <TouchableOpacity key={r.days}
              style={[styles.rangeChip, range === r.days && styles.rangeChipActive]}
              onPress={() => setRange(r.days)}>
              <Text style={[styles.rangeText, range === r.days && styles.rangeTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Portfolio value area chart */}
        <GlassCard glow accent={colors.cyan} style={styles.section}>
          <Text style={styles.cardLabel}>CUMULATIVE HT EARNED</Text>
          <View style={styles.valueRow}>
            <Text style={styles.bigValue}>{totalEarned}</Text>
            <Text style={styles.valueUnit}>HT</Text>
          </View>
          {cumulative.length > 0 ? (
            <AreaChart values={cumulative} color={colors.cyan} height={130} />
          ) : (
            <Text style={styles.empty}>No data in this range.</Text>
          )}
        </GlassCard>

        {/* Zone distribution */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Zone Distribution</Text>
          {history.length > 0 ? (
            <Donut segments={[
              { value: zoneCounts.green || 0, color: colors.green, label: "Green" },
              { value: zoneCounts.yellow || 0, color: colors.yellow, label: "Yellow" },
              { value: zoneCounts.red || 0, color: colors.red, label: "Red" },
            ]} />
          ) : <Text style={styles.empty}>No logs yet.</Text>}
        </GlassCard>

        {/* Delta improvement vs baseline */}
        {progress?.has_baseline && (
          <GlassCard glow accent={colors.lime} style={styles.section}>
            <Text style={styles.sectionTitle}>Improvement vs Baseline</Text>
            {Object.keys(METRIC_LABELS).map((m) => {
              const pct = progress.improvement[m];
              const positive = pct > 0;
              return (
                <View key={m} style={styles.improveRow}>
                  <Text style={styles.improveLabel}>{METRIC_LABELS[m]}</Text>
                  <Text style={styles.improveBase}>{progress.baseline[m]} → {progress.current[m]}</Text>
                  <View style={[styles.improveTag, { borderColor: positive ? colors.green : colors.red }]}>
                    <Ionicons name={positive ? "arrow-down" : "arrow-up"} size={11} color={positive ? colors.green : colors.red} />
                    <Text style={[styles.improvePct, { color: positive ? colors.green : colors.red }]}>
                      {Math.abs(pct)}%
                    </Text>
                  </View>
                </View>
              );
            })}
            <Text style={styles.hint}>Lower cardiovascular numbers earn Delta bonus tokens.</Text>
          </GlassCard>
        )}

        {/* Performance summary */}
        <View style={styles.bentoRow}>
          <GlassCard style={styles.stat}>
            <Text style={styles.statValue}>{totalStaked}</Text>
            <Text style={styles.statLabel}>HT Staked</Text>
          </GlassCard>
          <GlassCard style={styles.stat} glow accent={colors.green}>
            <Text style={[styles.statValue, { color: colors.green }]}>
              {successRate === null ? "—" : `${successRate}%`}
            </Text>
            <Text style={styles.statLabel}>Goal Success</Text>
          </GlassCard>
        </View>

        {/* Timeline */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {history.length === 0 ? (
            <Text style={styles.empty}>No history yet.</Text>
          ) : (
            [...history].reverse().map((item, idx) => (
              <View key={idx} style={styles.item}>
                <View style={[styles.zoneDot, { backgroundColor: zoneTint(item.zone) }]} />
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.metricMini}>{item.systolic_bp}/{item.diastolic_bp}</Text>
                <Text style={styles.tokens}>+{item.tokens_earned} HT</Text>
              </View>
            ))
          )}
        </GlassCard>
        <View style={{ height: 90 }} />
      </ScrollView>
    </Backdrop>
  );
}

const zoneTint = (z) => ({ green: colors.green, yellow: colors.yellow, red: colors.red }[(z || "").toLowerCase()] || colors.textFaint);

const styles = StyleSheet.create({
  container: { padding: space.md, paddingTop: 60 },
  eyebrow: { color: colors.cyan, fontSize: font.tiny, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "900", marginTop: 4, marginBottom: space.md },

  rangeRow: { flexDirection: "row", gap: 8, marginBottom: space.md },
  rangeChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.stroke },
  rangeChipActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  rangeText: { color: colors.textMuted, fontWeight: "800", fontSize: font.small },
  rangeTextActive: { color: colors.bg },

  section: { marginBottom: space.md },
  cardLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", letterSpacing: 1.5 },
  valueRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6, marginBottom: 14 },
  bigValue: { color: colors.white, fontSize: 40, fontWeight: "900", lineHeight: 44 },
  valueUnit: { color: colors.cyan, fontSize: font.h3, fontWeight: "800", marginLeft: 6, marginBottom: 6 },
  sectionTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800", marginBottom: 14 },
  empty: { color: colors.textFaint, fontSize: font.small },

  improveRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.stroke },
  improveLabel: { color: colors.text, fontSize: font.body, fontWeight: "600", flex: 1 },
  improveBase: { color: colors.textMuted, fontSize: font.small, marginRight: 10 },
  improveTag: { flexDirection: "row", alignItems: "center", gap: 2, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  improvePct: { fontSize: font.tiny, fontWeight: "800" },
  hint: { color: colors.textFaint, fontSize: font.tiny, marginTop: 12 },

  bentoRow: { flexDirection: "row", gap: space.md, marginBottom: space.md },
  stat: { flex: 1, alignItems: "center", padding: 16 },
  statValue: { color: colors.lime, fontSize: 30, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: font.small, marginTop: 4 },

  item: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.stroke },
  zoneDot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 },
  date: { color: colors.text, fontSize: font.small, fontWeight: "600", flex: 1 },
  metricMini: { color: colors.textMuted, fontSize: font.small, marginRight: 12 },
  tokens: { color: colors.lime, fontSize: font.small, fontWeight: "800" },
});
