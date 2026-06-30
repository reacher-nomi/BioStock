import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { Backdrop, GlassCard } from "../../components/Glass";
import { AnimatedCounter, FadeInView } from "../../components/Motion";
import api from "../../utils/api";
import { colors, font, radius, space } from "../../utils/theme";

const TYPE_META = {
  MINT: { icon: "arrow-down-circle", color: colors.green, label: "Reward" },
  REWARD: { icon: "arrow-down-circle", color: colors.green, label: "Reward" },
  BURN: { icon: "lock-closed", color: colors.yellow, label: "Stake" },
  STAKE: { icon: "lock-closed", color: colors.yellow, label: "Stake" },
};

const meta = (t) => TYPE_META[t] || { icon: "swap-horizontal", color: colors.textMuted, label: t };

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bal, led] = await Promise.all([
        api.get("/tokens/balance"),
        api.get("/tokens/ledger?limit=100"),
      ]);
      setBalance(bal.data.balance);
      setLedger(led.data);
    } catch (e) { /* keep last good state */ }
    finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const earned = ledger.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const spent = ledger.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0);

  return (
    <Backdrop>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.cyan} />}
      >
        <Text style={styles.eyebrow}>HEALTH TOKEN WALLET</Text>
        <Text style={styles.title}>Activity</Text>

        <GlassCard glow accent={colors.cyan} style={styles.balanceCard}>
          <Text style={styles.cardLabel}>CURRENT BALANCE</Text>
          <View style={styles.balanceRow}>
            <AnimatedCounter value={balance} style={styles.balance} />
            <Text style={styles.balanceUnit}>HT</Text>
          </View>
          <View style={styles.flowRow}>
            <View style={styles.flowItem}>
              <Ionicons name="arrow-down" size={14} color={colors.green} />
              <Text style={[styles.flowText, { color: colors.green }]}>{earned} earned</Text>
            </View>
            <View style={styles.flowItem}>
              <Ionicons name="arrow-up" size={14} color={colors.yellow} />
              <Text style={[styles.flowText, { color: colors.yellow }]}>{Math.abs(spent)} staked</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>Transactions</Text>
        {ledger.length === 0 ? (
          <GlassCard><Text style={styles.empty}>No transactions yet. Log your biometrics to mint your first tokens.</Text></GlassCard>
        ) : (
          ledger.map((e, i) => {
            const m = meta(e.transaction_type);
            const positive = e.amount > 0;
            return (
              <FadeInView key={e.id} delay={Math.min(i, 8) * 40}>
                <GlassCard style={styles.txCard}>
                  <View style={[styles.txIcon, { backgroundColor: m.color + "22" }]}>
                    <Ionicons name={m.icon} size={18} color={m.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txReason} numberOfLines={1}>{e.reason}</Text>
                    <Text style={styles.txDate}>{m.label} · {String(e.created_at).slice(0, 10)}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: positive ? colors.green : colors.yellow }]}>
                    {positive ? "+" : ""}{e.amount} HT
                  </Text>
                </GlassCard>
              </FadeInView>
            );
          })
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

  balanceCard: { marginBottom: space.lg },
  cardLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", letterSpacing: 1.5 },
  balanceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 8 },
  balance: { color: colors.white, fontSize: 46, fontWeight: "900", lineHeight: 48 },
  balanceUnit: { color: colors.cyan, fontSize: font.h3, fontWeight: "800", marginLeft: 8, marginBottom: 6 },
  flowRow: { flexDirection: "row", gap: 18, marginTop: 14 },
  flowItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  flowText: { fontSize: font.small, fontWeight: "700" },

  sectionTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800", marginBottom: 12 },
  empty: { color: colors.textFaint, fontSize: font.small },

  txCard: { flexDirection: "row", alignItems: "center", marginBottom: 10, padding: 14 },
  txIcon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txReason: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  txDate: { color: colors.textFaint, fontSize: font.tiny, marginTop: 2 },
  txAmount: { fontSize: font.body, fontWeight: "800", marginLeft: 8 },
});
