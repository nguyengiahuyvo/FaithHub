import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TabTwoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.body}>
          This tab is ready for discovery content, categories, or search-driven
          navigation.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ideas for this screen</Text>
        <Text style={styles.body}>
          Surface devotionals, sermons, groups, or curated topics.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current state</Text>
        <Text style={styles.body}>
          All Expo starter examples and their supporting components have been
          removed from this project.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 60,
    gap: 16,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: "#2C3E2C",
    fontSize: 30,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    color: "#2C3E2C",
    fontSize: 17,
    fontWeight: "600",
  },
  body: {
    color: "#6B7264",
    fontSize: 15,
    lineHeight: 23,
  },
});
