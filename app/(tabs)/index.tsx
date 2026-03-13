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
