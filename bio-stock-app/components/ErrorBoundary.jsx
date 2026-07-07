import { Ionicons } from "@expo/vector-icons";
import { Component } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, font, radius, space } from "../utils/theme";

// Catches render errors in its subtree so one broken screen shows a
// recoverable fallback instead of a blank/crashed app. Must be a class
// component — React has no hook equivalent for getDerivedStateFromError.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.red} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>This screen hit an unexpected error.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.lg, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: font.h3, fontWeight: "800", marginTop: 14 },
  subtitle: { color: colors.textMuted, fontSize: font.body, marginTop: 6, textAlign: "center" },
  button: { backgroundColor: colors.cyan, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 24, marginTop: 20 },
  buttonText: { color: colors.bg, fontWeight: "900", fontSize: font.body },
});
