import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const copy =
    mode === "login"
      ? {
          title: "Welcome back.",
          description:
            "Sign in to continue your reading plan, saved prayers, and community updates.",
          primaryAction: "Log In",
          secondaryLabel: "New here?",
          secondaryAction: "Create an account",
        }
      : {
          title: "Create your account.",
          description:
            "Start with a simple profile so FaithHub can keep your progress and preferences in sync.",
          primaryAction: "Sign Up",
          secondaryLabel: "Already have an account?",
          secondaryAction: "Log in instead",
        };

  return (
    <View style={styles.screen}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroBlock}>
            <Text style={styles.eyebrow}>FaithHub</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.description}</Text>

            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Daily devotionals</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Prayer journal</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => setMode("login")}
                style={[
                  styles.segmentButton,
                  mode === "login" ? styles.segmentButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === "login" ? styles.segmentTextActive : null,
                  ]}
                >
                  Log In
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode("signup")}
                style={[
                  styles.segmentButton,
                  mode === "signup" ? styles.segmentButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === "signup" ? styles.segmentTextActive : null,
                  ]}
                >
                  Sign Up
                </Text>
              </Pressable>
            </View>

            {mode === "signup" ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#8A8F98"
                  style={styles.input}
                  value={fullName}
                />
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#8A8F98"
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                onChangeText={setPassword}
                placeholder={
                  mode === "login" ? "Enter your password" : "Create a password"
                }
                placeholderTextColor="#8A8F98"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            {mode === "signup" ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#8A8F98"
                  secureTextEntry
                  style={styles.input}
                  value={confirmPassword}
                />
              </View>
            ) : null}

            <Pressable
              onPress={() => router.replace("/(tabs)")}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>{copy.primaryAction}</Text>
            </Pressable>

            <Pressable
              onPress={() => setMode(mode === "login" ? "signup" : "login")}
              style={styles.secondaryAction}
            >
              <Text style={styles.secondaryActionText}>
                {copy.secondaryLabel}{" "}
                <Text style={styles.secondaryActionStrong}>
                  {copy.secondaryAction}
                </Text>
              </Text>
            </Pressable>

            <Text style={styles.footnote}>
              By continuing, you agree to FaithHub&apos;s terms and privacy
              policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7EFE5",
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 28,
  },
  glowTop: {
    position: "absolute",
    top: -80,
    right: -40,
    height: 220,
    width: 220,
    borderRadius: 999,
    backgroundColor: "#D9A25F",
    opacity: 0.22,
  },
  glowBottom: {
    position: "absolute",
    bottom: -100,
    left: -60,
    height: 260,
    width: 260,
    borderRadius: 999,
    backgroundColor: "#7A8E6A",
    opacity: 0.16,
  },
  heroBlock: {
    gap: 14,
  },
  eyebrow: {
    color: "#8D5B2D",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#1F2A1F",
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 42,
  },
  body: {
    color: "#5C625C",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 440,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    borderColor: "rgba(141, 91, 45, 0.16)",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillText: {
    color: "#6A5030",
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(31, 42, 31, 0.08)",
    padding: 22,
    gap: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EEE4D6",
    borderRadius: 16,
    padding: 6,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
  },
  segmentButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    color: "#7A6B58",
    fontSize: 15,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#1F2A1F",
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8D0C4",
    borderRadius: 16,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1F3B2E",
    borderRadius: 18,
    marginTop: 8,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryAction: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryActionText: {
    color: "#5F665E",
    fontSize: 14,
  },
  secondaryActionStrong: {
    color: "#1F3B2E",
    fontWeight: "700",
  },
  footnote: {
    color: "#7B7F85",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
