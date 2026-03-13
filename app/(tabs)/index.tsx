import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>FaithHub</Text>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.body}>
          You are inside the main app now. Replace this screen with your
          dashboard, latest content, or user-specific activity.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested next build</Text>
        <Text style={styles.body}>
          Connect the auth form to a real backend and gate this tab group behind
          authenticated state.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current routing</Text>
        <Text style={styles.body}>
          The app opens on a standalone login screen, and the tabs appear only
          after entering the main app flow.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  eyebrow: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "600",
  },
  body: {
    color: "#4B5563",
    fontSize: 16,
    lineHeight: 24,
  },
});
