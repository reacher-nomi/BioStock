import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text } from "react-native";

import { colors } from "../utils/theme";

// Count-up animation for a numeric value.
export function AnimatedCounter({ value = 0, duration = 900, style, suffix = "" }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value, duration, anim]);

  return <Text style={style}>{display}{suffix}</Text>;
}

// Fade + slide-in on mount, optionally staggered by `delay`.
export function FadeInView({ children, delay = 0, offset = 12, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// Pressable that scales down slightly while pressed (tactile feedback).
export function PressableScale({ children, onPress, style, disabled, scaleTo = 0.96 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, friction: 6, tension: 120, useNativeDriver: true }).start();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export const accentForZone = (zone) =>
  ({ green: colors.green, yellow: colors.yellow, red: colors.red }[(zone || "").toLowerCase()] || colors.cyan);
