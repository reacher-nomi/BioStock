import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Backdrop, GlassCard } from "../../components/Glass";
import api from "../../utils/api";
import { colors, font, radius, space, zoneColor } from "../../utils/theme";

export default function PortfolioScreen() {
  const [history, setHistory] = useState([]);

  useFocusEffect(useCallback(() => {
    let active = true;
    api.get("/health/history?days=30").then((res) => { if (active) setHistory(res.data); }).catch(() => {});
    return () => { active = false; };
  }, []));

  const totalEarned = history.reduce((s, h) => s + (h.tokens_earned || 0), 0);
  const greenDays = history.filter((h) => (h.zone || "").toLowerCase() === "green").length;

  return (
    <Backdrop>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR PORTFOLIO</Text>
        <Text style={styles.title}>Health History</Text>

        <View style={styles.bentoRow}>
          <GlassCard style={styles.stat} glow accent={colors.lime}>
            <Text style={styles.statValue}>{totalEarned}</Text>
            <Text style={styles.statLabel}>HT Earned (30d)</Text>
          </GlassCard>
          <GlassCard style={styles.stat} glow accent={colors.green}>
            <Text style={[styles.statValue, { color: colors.green }]}>{greenDays}</Text>
            <Text style={styles.statLabel}>Green Days</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {history.length === 0 ? (
            <Text style={styles.empty}>No history yet.</Text>
          ) : (
            [...history].reverse().map((item, idx) => (
              <View key={idx} style={styles.item}>
                <View style={[styles.zoneDot, { backgroundColor: zoneColor(item.zone) }]} />
                <Text style={styles.date}>{item.date}</Text>
                <View style={[styles.zoneTag, { borderColor: zoneColor(item.zone) }]}>
                  <Text style={[styles.zoneText, { color: zoneColor(item.zone) }]}>{item.zone?.toUpperCase()}</Text>
                </View>
                <View style={styles.tokenWrap}>
                  <Ionicons name="add" size={12} color={colors.lime} />
                  <Text style={styles.tokens}>{item.tokens_earned} HT</Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>
        <View style={{ height: 90 }} />
      </ScrollView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.md, paddingTop: 60 },
  eyebrow: { color: colors.cyan, fontSize: font.tiny, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.text, fontSize: font.h1, fontWeight: "900", marginTop: 4, marginBottom: space.lg },

  bentoRow: { flexDirection: "row", gap: space.md, marginBottom: space.md },
  stat: { flex: 1, alignItems: "center", padding: 16 },
  statValue: { color: colors.lime, fontSize: 34, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: font.small, marginTop: 4 },

  section: { marginBottom: space.md },
  sectionTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800", marginBottom: 12 },
  empty: { color: colors.textFaint, fontSize: font.small },

  item: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.stroke },
  zoneDot: { width: 9, height: 9, borderRadius: 5, marginRight: 12 },
  date: { color: colors.text, fontSize: font.body, fontWeight: "600", flex: 1 },
  zoneTag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2, marginRight: 10 },
  zoneText: { fontSize: font.tiny, fontWeight: "800" },
  tokenWrap: { flexDirection: "row", alignItems: "center", width: 64, justifyContent: "flex-end" },
  tokens: { color: colors.lime, fontSize: font.small, fontWeight: "800" },
});
