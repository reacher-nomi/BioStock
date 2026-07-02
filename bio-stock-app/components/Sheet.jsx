import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, font, radius, space } from "../utils/theme";

// Glass bottom-sheet modal. Tap the backdrop or the close button to dismiss.
export function Sheet({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(2,6,14,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingHorizontal: space.lg,
    paddingBottom: 34,
    maxHeight: "85%",
  },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.strokeStrong, alignSelf: "center", marginTop: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 6 },
  title: { color: colors.text, fontSize: font.h2, fontWeight: "900" },
  closeBtn: { padding: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceStrong },
  body: { paddingTop: 10, paddingBottom: 10 },
});
