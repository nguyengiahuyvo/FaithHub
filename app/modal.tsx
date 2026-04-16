import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/components/HapticPressable";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      <Text style={styles.body}>
        Use this route for focused flows, confirmations, or quick actions.
      </Text>
      <Link href="/" dismissTo asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Go to home screen</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
  },
  body: {
    color: "#4B5563",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
