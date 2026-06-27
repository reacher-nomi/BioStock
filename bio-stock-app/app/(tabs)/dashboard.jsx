import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";

import { Backdrop, GlassCard } from "../../components/Glass";
import api from "../../utils/api";
import { colors, font, radius, space, zoneColor } from "../../utils/theme";

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const router = useRouter();

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await api.get("/dashboard/");
      setData(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchDashboard(); }, [fetchDashboard]));

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };
  const logout = async () => {
    await AsyncStorage.removeItem("access_token");
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <Backdrop style={styles.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </Backdrop>
    );
  }

  const zone = data?.today_zone;
  const recent = data?.recent_logs ?? [];
  const goals = data?.active_goals ?? [];
  const name = (data?.user_email || "").split("@")[0];

  return (
    <Backdrop>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>BIO-STOCK</Text>
            <Text style={styles.hello}>Hey, {name} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* Hero balance */}
        <GlassCard glow accent={colors.cyan} style={styles.hero}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>HEALTH TOKEN BALANCE</Text>
            <Ionicons name="wallet-outline" size={18} color={colors.cyan} />
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>{data?.token_balance ?? 0}</Text>
            <Text style={styles.balanceUnit}>HT</Text>
          </View>
          <Text style={styles.heroSub}>Staked on lowering your biological risk</Text>
        </GlassCard>

        {/* Bento row: streak + today zone */}
        <View style={styles.bentoRow}>
          <GlassCard style={styles.bentoHalf} glow accent={colors.lime}>
            <Ionicons name="flame" size={22} color={colors.lime} />
            <Text style={styles.bentoValue}>{data?.current_streak ?? 0}</Text>
            <Text style={styles.bentoLabel}>Day Streak</Text>
          </GlassCard>

          <GlassCard style={styles.bentoHalf} glow accent={zoneColor(zone)}>
            <Ionicons name="ellipse" size={22} color={zoneColor(zone)} />
            <Text style={[styles.bentoValue, { color: zoneColor(zone) }]}>
              {zone ? zone.toUpperCase() : "—"}
            </Text>
            <Text style={styles.bentoLabel}>Today's Zone</Text>
          </GlassCard>
        </View>

        {/* Weekly activity */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          {recent.length === 0 ? (
            <Text style={styles.empty}>No logs yet — head to the Log tab.</Text>
          ) : (
            <View style={styles.weekRow}>
              {recent.slice(-7).map((log, i) => (
                <View key={i} style={styles.dayCol}>
                  <View style={[styles.bar, { backgroundColor: zoneColor(log.zone), height: 18 + (log.tokens || 0) * 3 }]} />
                  <Text style={styles.dayLabel}>{String(log.date).slice(5)}</Text>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Active goals */}
        <GlassCard style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Active Stakes</Text>
            <Text style={styles.countBadge}>{goals.length}</Text>
          </View>
          {goals.length === 0 ? (
            <Text style={styles.empty}>No active stakes. Commit tokens in the Stake tab.</Text>
          ) : (
            goals.map((g) => (
              <View key={g.id} style={styles.goalRow}>
                <View style={styles.goalDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalName}>{g.name}</Text>
                  <Text style={styles.goalMeta}>{g.days_remaining} days left</Text>
                </View>
                <Text style={styles.goalStake}>{g.stake_amount} HT</Text>
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
  center: { alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg },
  eyebrow: { color: colors.cyan, fontSize: font.tiny, fontWeight: "800", letterSpacing: 2 },
  hello: { color: colors.text, fontSize: font.h2, fontWeight: "800", marginTop: 2 },
  logoutBtn: { padding: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.stroke },

  hero: { marginBottom: space.md },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", letterSpacing: 1.5 },
  balanceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 10 },
  balance: { color: colors.white, fontSize: 52, fontWeight: "900", lineHeight: 56 },
  balanceUnit: { color: colors.cyan, fontSize: font.h3, fontWeight: "800", marginLeft: 8, marginBottom: 8 },
  heroSub: { color: colors.textFaint, fontSize: font.small, marginTop: 6 },

  bentoRow: { flexDirection: "row", gap: space.md, marginBottom: space.md },
  bentoHalf: { flex: 1, padding: 16 },
  bentoValue: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: 10 },
  bentoLabel: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },

  section: { marginBottom: space.md },
  sectionTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800", marginBottom: 12 },
  empty: { color: colors.textFaint, fontSize: font.small },
  countBadge: { color: colors.cyan, backgroundColor: colors.surfaceStrong, paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill, fontWeight: "800", fontSize: font.small, overflow: "hidden" },

  weekRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 110 },
  dayCol: { alignItems: "center", flex: 1 },
  bar: { width: 12, borderRadius: 6, marginBottom: 8 },
  dayLabel: { color: colors.textFaint, fontSize: 9 },

  goalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.stroke },
  goalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lime, marginRight: 12 },
  goalName: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  goalMeta: { color: colors.textFaint, fontSize: font.tiny, marginTop: 2 },
  goalStake: { color: colors.lime, fontSize: font.body, fontWeight: "800" },

  error: { color: colors.red, marginBottom: 12 },
});
