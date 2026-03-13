import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>FaithHub</Text>
        <Text style={styles.title}>
          Welcome{user?.displayName ? `, ${user.displayName}` : ""}
        </Text>
        <Text style={styles.body}>
          Your reading plans, saved prayers, and community updates will appear
          here.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your dashboard</Text>
        <Text style={styles.body}>
          You are signed in. Start exploring devotionals, sermons, and community
          groups from the Explore tab.
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
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  eyebrow: {
    color: "#8D5B2D",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    color: "#2C3E2C",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  sectionTitle: {
    color: "#2C3E2C",
    fontSize: 18,
    fontWeight: "600",
  },
  body: {
    color: "#6B7264",
    fontSize: 15,
    lineHeight: 23,
  },
});
