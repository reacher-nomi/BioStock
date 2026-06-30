import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";

import { colors, font } from "../utils/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Animated circular progress gauge (the dashboard "Health Score" ring).
export function ProgressRing({ size = 160, strokeWidth = 14, progress = 0, color = colors.cyan, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(100, Math.max(0, progress)), duration: 1100, useNativeDriver: false }).start();
  }, [progress, anim]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.stroke} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: "center" }}>{children}</View>
    </View>
  );
}

// Build a smooth (Catmull-Rom -> bezier) SVG path for a series of values.
function smoothPath(values, w, h, pad = 4) {
  if (values.length === 0) return "";
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => [pad + i * stepX, h - pad - ((v - min) / span) * (h - pad * 2)]);

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(0, i - 1)];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
  }
  return { line: d, area: `${d} L ${pts[pts.length - 1][0]} ${h} L ${pts[0][0]} ${h} Z` };
}

// Smooth area + line chart.
export function AreaChart({ values, color = colors.cyan, height = 130 }) {
  const width = 320;
  if (!values || values.length === 0) return <View style={{ height }} />;
  const { line, area } = smoothPath(values, width, height);

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0.02" />
        </SvgGradient>
      </Defs>
      <Path d={area} fill="url(#areaFill)" />
      <Path d={line} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Donut chart from segments [{ value, color, label }].
export function Donut({ segments, size = 150, strokeWidth = 22 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
      <Svg width={size} height={size}>
        {segments.map((s, i) => {
          if (s.value <= 0) return null;
          const len = (s.value / total) * circumference;
          const circle = (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={s.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return circle;
        })}
      </Svg>
      <View style={{ gap: 8 }}>
        {segments.map((s, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label} {Math.round((s.value / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },
});
