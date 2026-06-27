import { StyleSheet, Text, View } from "react-native";

import { colors, font, radius } from "../utils/theme";

// Area-style chart built from vertical bars (no native SVG needed).
export function AreaBars({ values, color = colors.cyan, height = 120 }) {
  const max = Math.max(1, ...values);
  return (
    <View style={[styles.areaWrap, { height }]}>
      {values.map((v, i) => (
        <View key={i} style={styles.areaCol}>
          <View
            style={{
              width: "70%",
              height: Math.max(2, (v / max) * (height - 8)),
              backgroundColor: color + "AA",
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            }}
          />
        </View>
      ))}
    </View>
  );
}

// Horizontal stacked proportion bar. segments: [{ value, color, label }]
export function ProportionBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <View>
      <View style={styles.propBar}>
        {segments.map((s, i) =>
          s.value > 0 ? (
            <View key={i} style={{ flex: s.value, backgroundColor: s.color }} />
          ) : null
        )}
      </View>
      <View style={styles.legendRow}>
        {segments.map((s, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>
              {s.label} {Math.round((s.value / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  areaWrap: { flexDirection: "row", alignItems: "flex-end" },
  areaCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  propBar: { flexDirection: "row", height: 14, borderRadius: radius.pill, overflow: "hidden", backgroundColor: colors.surfaceStrong },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "600" },
});
