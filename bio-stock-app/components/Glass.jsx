import { StyleSheet, View } from "react-native";

import { colors, radius } from "../utils/theme";

// 8% alpha suffix for a 6-digit hex color.
const tint = (hex, alpha = "14") => `${hex}${alpha}`;

// Frosted "liquid glass" panel: translucent fill + accent sheen + hairline stroke.
export function GlassCard({ children, style, glow, accent = colors.cyan }) {
  return (
    <View style={[styles.wrap, style]}>
      {glow ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tint(accent) }]} /> : null}
      <View style={[StyleSheet.absoluteFill, styles.sheen]} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

// Full-screen app background with subtle ambient corner tints.
export function Backdrop({ children, style }) {
  return (
    <View style={[styles.backdrop, style]}>
      <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    overflow: "hidden",
    backgroundColor: colors.bgElevated,
  },
  sheen: { backgroundColor: "rgba(255,255,255,0.04)", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  inner: { padding: 18 },

  backdrop: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  glow: { position: "absolute", width: 360, height: 360, borderRadius: 360, opacity: 0.5 },
  glowTop: { top: -140, right: -120, backgroundColor: "#0E2A38" },
  glowBottom: { bottom: -150, left: -120, backgroundColor: "#1A2A12" },
});
