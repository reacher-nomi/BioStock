import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { colors, radius } from "../utils/theme";

// Frosted "liquid glass" panel: translucent fill + soft top-light + accent glow.
export function GlassCard({ children, style, glow, accent = colors.cyan }) {
  return (
    <View style={[styles.wrap, style]}>
      {glow ? (
        <LinearGradient
          colors={[accent + "30", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <LinearGradient
        colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0.015)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

// Full-screen app background with soft animated-feeling gradient glows.
export function Backdrop({ children, style }) {
  return (
    <View style={[styles.backdrop, style]}>
      <LinearGradient
        colors={["#0C2230", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.6 }}
        style={styles.glowTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["#1A2A12", "transparent"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.6, y: 0.3 }}
        style={styles.glowBottom}
        pointerEvents="none"
      />
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
  inner: { padding: 18 },
  backdrop: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  glowTop: { position: "absolute", top: -40, right: -40, width: 380, height: 380, borderRadius: 380, opacity: 0.55 },
  glowBottom: { position: "absolute", bottom: -60, left: -50, width: 380, height: 340, borderRadius: 380, opacity: 0.5 },
});
