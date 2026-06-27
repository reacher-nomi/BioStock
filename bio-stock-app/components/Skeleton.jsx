import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { colors, radius } from "../utils/theme";

// Pulsing placeholder block shown while data loads.
export function Skeleton({ height = 20, width = "100%", style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { height, width, opacity }, style]} />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceStrong, borderRadius: radius.sm, marginBottom: 12 },
});
