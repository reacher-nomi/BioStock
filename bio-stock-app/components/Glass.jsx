import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { colors, radius } from "../utils/theme";

// Frosted "liquid glass" panel: translucent fill + soft top-light gradient + hairline stroke.
export function GlassCard({ children, style, glow, accent = colors.cyan }) {
  return (
    <View style={[styles.wrap, style]}>
      {glow ? (
        <LinearGradient
          colors={[accent + "26", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <LinearGradient
        colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0.015)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

// Full-screen app background with ambient corner glows.
export function Backdrop({ children, style }) {
  return (
    <View style={[styles.backdrop, style]}>
      <LinearGradient
        colors={["#0A1A24", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.5 }}
        style={styles.glowTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["#13200E", "transparent"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.5, y: 0.4 }}
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
  backdrop: { flex: 1, backgroundColor: colors.bg },
  glowTop: { position: "absolute", top: 0, right: 0, width: 320, height: 320, opacity: 0.7 },
  glowBottom: { position: "absolute", bottom: 0, left: 0, width: 340, height: 300, opacity: 0.6 },
});
