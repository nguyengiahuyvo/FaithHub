import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const { user } = useAuth();

  const initials = (user?.displayName ?? user?.email ?? "?")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  async function handleSignOut() {
    await signOut(auth);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {user?.displayName || "FaithHub Member"}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>

        <View style={styles.row}>
          <Ionicons name="person-outline" size={20} color="#4B5563" />
          <Text style={styles.rowLabel}>Display name</Text>
          <Text style={styles.rowValue}>
            {user?.displayName || "Not set"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="mail-outline" size={20} color="#4B5563" />
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4B5563" />
          <Text style={styles.rowLabel}>Account ID</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {user?.uid.slice(0, 12)}...
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Preferences</Text>

        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={20} color="#4B5563" />
          <Text style={styles.rowLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="moon-outline" size={20} color="#4B5563" />
          <Text style={styles.rowLabel}>Appearance</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </View>

      <Pressable onPress={handleSignOut} style={styles.signOutButton}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <Text style={styles.version}>FaithHub v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 60,
    gap: 20,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1F3B2E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  name: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    color: "#6B7280",
    fontSize: 15,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  sectionLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  rowLabel: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
  },
  rowValue: {
    color: "#6B7280",
    fontSize: 14,
    maxWidth: 160,
    textAlign: "right",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#FECACA",
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
  },
  signOutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },
  version: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
  },
});
