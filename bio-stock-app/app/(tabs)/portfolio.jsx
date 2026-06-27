import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import api from "../../utils/api";

export default function PortfolioScreen() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get("/health/history?days=30");
      setHistory(res.data);
    };
    fetchData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Health History</Text>
      {history.map((item, idx) => (
        <View key={idx} style={styles.item}>
          <Text>{item.date}</Text>
          <Text>{item.zone?.toUpperCase()}</Text>
          <Text>{item.tokens_earned} HT</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f9fafb", minHeight: "100%" },
  title: { fontWeight: "700", fontSize: 22, marginBottom: 10 },
  item: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
