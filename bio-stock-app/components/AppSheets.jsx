import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

import { colors, font, radius, space } from "../utils/theme";
import { Sheet } from "./Sheet";

// ---------------- Connect Device (mocked wearable sync) ----------------
const DEVICES = [
  { id: "apple", name: "Apple Watch", icon: "watch-outline" },
  { id: "fitbit", name: "Fitbit", icon: "fitness-outline" },
  { id: "garmin", name: "Garmin", icon: "navigate-outline" },
  { id: "samsung", name: "Galaxy Watch", icon: "watch-outline" },
];

// Realistic, mostly-healthy values a wearable might report.
function mockReading() {
  const r = (a, b) => Math.round(a + Math.random() * (b - a));
  return {
    systolic_bp: r(108, 122),
    diastolic_bp: r(68, 80),
    steps: r(7200, 11500),
    sleep_hours: Number((6.8 + Math.random() * 2).toFixed(1)),
    resting_hr: r(56, 72),
  };
}

export function DeviceSheet({ visible, onClose, onSync }) {
  const [phase, setPhase] = useState("idle"); // idle | connecting | connected | syncing | done
  const [device, setDevice] = useState(null);
  const timers = useRef([]);

  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setPhase("idle"); setDevice(null); };
  useEffect(() => { if (!visible) reset(); return () => timers.current.forEach(clearTimeout); }, [visible]);

  const connect = (d) => {
    setDevice(d); setPhase("connecting");
    timers.current.push(setTimeout(() => setPhase("connected"), 1200));
    timers.current.push(setTimeout(() => setPhase("syncing"), 2100));
    timers.current.push(setTimeout(() => {
      setPhase("done");
      onSync(mockReading());
    }, 3200));
  };

  const statusText = { connecting: "Connecting…", connected: "Connected", syncing: "Syncing data…", done: "Sync successful" };

  return (
    <Sheet visible={visible} onClose={onClose} title="Connect a Device">
      {phase === "idle" ? (
        <>
          <Text style={styles.subtle}>Select a wearable to sync today's biometrics automatically.</Text>
          {DEVICES.map((d) => (
            <TouchableOpacity key={d.id} style={styles.deviceRow} onPress={() => connect(d)}>
              <View style={styles.deviceIcon}><Ionicons name={d.icon} size={20} color={colors.cyan} /></View>
              <Text style={styles.deviceName}>{d.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <View style={styles.syncBox}>
          <View style={[styles.syncIcon, phase === "done" && { backgroundColor: colors.green + "22" }]}>
            {phase === "done"
              ? <Ionicons name="checkmark" size={34} color={colors.green} />
              : <ActivityIndicator size="large" color={colors.cyan} />}
          </View>
          <Text style={styles.syncDevice}>{device?.name}</Text>
          <Text style={[styles.syncStatus, phase === "done" && { color: colors.green }]}>{statusText[phase]}</Text>
          {phase === "done" && (
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneText}>Use synced values</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Sheet>
  );
}

// ---------------- Redeem rewards (prototype) ----------------
const REWARDS = [
  { id: "gym", name: "€5 Gym Credit", cost: 150, icon: "barbell-outline" },
  { id: "coffee", name: "Healthy Café Voucher", cost: 80, icon: "cafe-outline" },
  { id: "insurance", name: "2% Insurance Discount", cost: 400, icon: "shield-checkmark-outline" },
  { id: "charity", name: "Donate to Health Charity", cost: 100, icon: "heart-outline" },
];

export function RedeemSheet({ visible, onClose, balance = 0, onRedeem }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Redeem Rewards">
      <Text style={styles.subtle}>You have {balance} HT to spend. (Prototype — no tokens are deducted.)</Text>
      {REWARDS.map((r) => {
        const affordable = balance >= r.cost;
        return (
          <View key={r.id} style={styles.deviceRow}>
            <View style={styles.deviceIcon}><Ionicons name={r.icon} size={20} color={colors.lime} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{r.name}</Text>
              <Text style={styles.rewardCost}>{r.cost} HT</Text>
            </View>
            <TouchableOpacity
              style={[styles.redeemBtn, !affordable && styles.redeemBtnOff]}
              disabled={!affordable}
              onPress={() => onRedeem(r)}>
              <Text style={[styles.redeemText, !affordable && { color: colors.textFaint }]}>
                {affordable ? "Redeem" : "Locked"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </Sheet>
  );
}

// ---------------- Help Center ----------------
const HELP_SECTIONS = [
  { icon: "sparkles", title: "What is Bio-Stock?", body: "Log your daily biometrics, earn Health Tokens (HT) for staying healthy, and stake them on short goals. Think of your health as a portfolio you can grow." },
  { icon: "pulse", title: "Logging & Zones", body: "Each day is scored GREEN (all metrics healthy), YELLOW (partly), or RED. GREEN earns 10 HT, YELLOW 3, RED 0." },
  { icon: "calculator", title: "How the Health Score works", body: "Your score is a weighted average of recent days (GREEN=100, YELLOW=60, RED=25). Improving your blood pressure and heart rate vs your baseline earns bonus tokens." },
  { icon: "flame", title: "Streaks", body: "Consecutive GREEN days multiply your rewards: 7 days ×1.5, 30 days ×2, 90 days ×3." },
  { icon: "trending-up", title: "Staking", body: "Lock tokens on a goal (e.g. 5 green days in 7). Succeed and you get your stake back plus a 20% bonus. Miss it and the stake is forfeited." },
];

export function HelpSheet({ visible, onClose }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Help Center">
      {HELP_SECTIONS.map((s) => (
        <View key={s.title} style={styles.helpRow}>
          <View style={styles.helpIcon}><Ionicons name={s.icon} size={18} color={colors.cyan} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.helpTitle}>{s.title}</Text>
            <Text style={styles.helpBody}>{s.body}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.tip}>Tip: log at the same time each day to keep your streak alive.</Text>
    </Sheet>
  );
}

// ---------------- Achievements ----------------
export function AchievementsSheet({ visible, onClose, balance = 0, streak = 0, recent = [] }) {
  const greenThisWeek = recent.filter((l) => (l.zone || "").toLowerCase() === "green").length;
  const badges = [
    { icon: "footsteps", label: "First Steps", desc: "Log your first day", done: recent.length > 0 },
    { icon: "flame", label: "7-Day Streak", desc: "7 green days in a row", done: streak >= 7 },
    { icon: "bonfire", label: "30-Day Streak", desc: "A full month", done: streak >= 30 },
    { icon: "checkmark-done", label: "Perfect Week", desc: "7 green days this week", done: greenThisWeek >= 7 },
    { icon: "wallet", label: "Saver", desc: "Reach 250 HT", done: balance >= 250 },
    { icon: "trophy", label: "Health Champion", desc: "Reach 1000 HT", done: balance >= 1000 },
  ];
  const unlocked = badges.filter((b) => b.done).length;

  return (
    <Sheet visible={visible} onClose={onClose} title="Achievements">
      <Text style={styles.subtle}>{unlocked} of {badges.length} unlocked</Text>
      <View style={styles.badgeGrid}>
        {badges.map((b) => (
          <View key={b.label} style={[styles.badge, b.done && styles.badgeDone]}>
            <View style={[styles.badgeIcon, { backgroundColor: b.done ? colors.lime + "22" : colors.surfaceStrong }]}>
              <Ionicons name={b.done ? b.icon : "lock-closed"} size={22} color={b.done ? colors.lime : colors.textFaint} />
            </View>
            <Text style={[styles.badgeLabel, { color: b.done ? colors.text : colors.textMuted }]}>{b.label}</Text>
            <Text style={styles.badgeDesc}>{b.desc}</Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

// ---------------- Settings / Profile ----------------
export function SettingsSheet({ visible, onClose, email = "", onLogout }) {
  const [name, setName] = useState("");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("display_name").then((v) => v && setName(v));
    AsyncStorage.getItem("notifications_on").then((v) => setNotifications(v !== "false"));
  }, [visible]);

  const saveName = (v) => { setName(v); AsyncStorage.setItem("display_name", v); };
  const toggleNotif = (v) => { setNotifications(v); AsyncStorage.setItem("notifications_on", String(v)); };

  return (
    <Sheet visible={visible} onClose={onClose} title="Settings">
      <View style={styles.avatarRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(name || email || "?").slice(0, 1).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>
      </View>

      <Text style={styles.label}>Display name</Text>
      <TextInput style={styles.input} value={name} onChangeText={saveName}
        placeholder="Your name" placeholderTextColor={colors.textFaint} />

      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Ionicons name="notifications-outline" size={20} color={colors.textMuted} />
          <Text style={styles.settingText}>Daily reminders</Text>
        </View>
        <Switch value={notifications} onValueChange={toggleNotif}
          trackColor={{ true: colors.cyan, false: colors.surfaceStrong }} thumbColor={colors.white} />
      </View>
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Ionicons name="moon-outline" size={20} color={colors.textMuted} />
          <Text style={styles.settingText}>Dark theme</Text>
        </View>
        <Text style={styles.settingHint}>On</Text>
      </View>
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} />
          <Text style={styles.settingText}>Privacy</Text>
        </View>
        <Text style={styles.settingHint}>Data stays on-device</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.red} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  deviceRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.stroke },
  deviceIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceStrong, alignItems: "center", justifyContent: "center" },
  deviceName: { color: colors.text, fontSize: font.body, fontWeight: "700", flex: 1 },
  rewardCost: { color: colors.lime, fontSize: font.tiny, fontWeight: "700", marginTop: 2 },
  redeemBtn: { backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  redeemBtnOff: { backgroundColor: colors.surfaceStrong },
  redeemText: { color: colors.bg, fontWeight: "800", fontSize: font.small },
  syncBox: { alignItems: "center", paddingVertical: 24 },
  syncIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceStrong, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  syncDevice: { color: colors.text, fontSize: font.h3, fontWeight: "800" },
  syncStatus: { color: colors.textMuted, fontSize: font.body, marginTop: 4 },
  doneBtn: { marginTop: 22, backgroundColor: colors.green, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 28 },
  doneText: { color: colors.bg, fontWeight: "900", fontSize: font.body },

  helpRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  helpIcon: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.surfaceStrong, alignItems: "center", justifyContent: "center" },
  helpTitle: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  helpBody: { color: colors.textMuted, fontSize: font.small, marginTop: 3, lineHeight: 19 },
  tip: { color: colors.lime, fontSize: font.small, fontWeight: "600", marginTop: 4 },

  subtle: { color: colors.textMuted, fontSize: font.small, marginBottom: 14 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  badge: { width: "47%", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.stroke, padding: 14, alignItems: "center" },
  badgeDone: { borderColor: colors.lime + "55" },
  badgeIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  badgeLabel: { fontSize: font.small, fontWeight: "800" },
  badgeDesc: { color: colors.textFaint, fontSize: font.tiny, marginTop: 2, textAlign: "center" },

  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: space.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cyan, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.bg, fontSize: font.h3, fontWeight: "900" },
  profileEmail: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  label: { color: colors.textMuted, fontSize: font.small, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.stroke, borderRadius: radius.sm, padding: 14, color: colors.white, fontSize: font.body, marginBottom: space.md },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.stroke },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingText: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  settingHint: { color: colors.textFaint, fontSize: font.small },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: space.lg, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.red + "55" },
  logoutText: { color: colors.red, fontSize: font.body, fontWeight: "800" },
});
