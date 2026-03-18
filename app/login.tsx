import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  OAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthMode = "login" | "signup";

type ErrorInfo = {
  title: string;
  message: string;
} | null;

function ErrorModal({
  error,
  onDismiss,
}: {
  error: ErrorInfo;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (error) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  function handleDismiss() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      scale.setValue(0.9);
      onDismiss();
    });
  }

  if (!error) return null;

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[modalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View style={modalStyles.iconCircle}>
            <Ionicons name="alert-circle" size={32} color="#DC2626" />
          </View>

          <Text style={modalStyles.title}>{error.title}</Text>
          <Text style={modalStyles.message}>{error.message}</Text>

          <Pressable onPress={handleDismiss} style={modalStyles.button}>
            <Text style={modalStyles.buttonText}>Try Again</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: "#1F2A1F",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: "#5C625C",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#1F3B2E",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sent" | "error">("idle");

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

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) return;
    setForgotSending(true);
    setForgotStatus("idle");
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotStatus("sent");
    } catch {
      setForgotStatus("error");
    } finally {
      setForgotSending(false);
    }
  }

  function openForgotModal() {
    setForgotEmail(email);
    setForgotStatus("idle");
    setShowForgot(true);
  }

  function showError(title: string, message: string) {
    setError({ title, message });
  }

  async function handleAppleSignIn() {
    try {
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const oauthCredential = new OAuthProvider("apple.com").credential({
        idToken: credential.identityToken!,
        rawNonce: nonce,
      });

      await signInWithCredential(auth, oauthCredential);
      router.replace("/(tabs)");
    } catch (error: any) {
      if (error.code !== "ERR_REQUEST_CANCELED") {
        showError("Apple Sign-In failed", error.message || "Please try again.");
      }
    }
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      showError("Missing fields", "Please fill in your email and password to continue.");
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        showError("Passwords don't match", "The passwords you entered don't match. Please try again.");
        return;
      }
      if (password.length < 6) {
        showError("Password too short", "Your password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (fullName.trim()) {
          await updateProfile(user, { displayName: fullName.trim() });
        }
        await sendEmailVerification(user);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace("/(tabs)");
    } catch (error: any) {
      const message = firebaseErrorMessage(error.code);
      showError(
        mode === "login" ? "Login failed" : "Sign-up failed",
        message
      );
    } finally {
      setLoading(false);
    }
  }

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

            {mode === "login" && (
              <Pressable onPress={openForgotModal} style={styles.forgotLink}>
                <Text style={styles.forgotLinkText}>Forgot password?</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {copy.primaryAction}
                </Text>
              )}
            </Pressable>

            {Platform.OS === "ios" && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={18}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              </>
            )}

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

      <ForgotPasswordModal
        visible={showForgot}
        email={forgotEmail}
        onChangeEmail={setForgotEmail}
        sending={forgotSending}
        status={forgotStatus}
        onSend={handleForgotPassword}
        onDismiss={() => setShowForgot(false)}
      />

      <ErrorModal error={error} onDismiss={() => setError(null)} />
    </View>
  );
}

function ForgotPasswordModal({
  visible,
  email,
  onChangeEmail,
  sending,
  status,
  onSend,
  onDismiss,
}: {
  visible: boolean;
  email: string;
  onChangeEmail: (v: string) => void;
  sending: boolean;
  status: "idle" | "sent" | "error";
  onSend: () => void;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.9);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  function handleDismiss() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      scale.setValue(0.9);
      onDismiss();
    });
  }

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[modalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View style={modalStyles.iconCircle}>
            <Ionicons name="key-outline" size={32} color="#D97706" />
          </View>
          <Text style={modalStyles.title}>Reset password</Text>
          <Text style={modalStyles.message}>
            Enter your email and we'll send you a link to reset your password.
          </Text>

          <TextInput
            value={email}
            onChangeText={onChangeEmail}
            placeholder="you@example.com"
            placeholderTextColor="#8A8F98"
            autoCapitalize="none"
            keyboardType="email-address"
            style={forgotStyles.input}
          />

          {status === "sent" && (
            <Text style={forgotStyles.success}>
              Password reset email sent! Check your inbox.
            </Text>
          )}
          {status === "error" && (
            <Text style={forgotStyles.error}>
              Could not send reset email. Please check your email and try again.
            </Text>
          )}

          <Pressable
            onPress={onSend}
            disabled={sending || !email.trim()}
            style={[
              forgotStyles.sendBtn,
              (sending || !email.trim()) && { opacity: 0.6 },
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={forgotStyles.sendBtnText}>Send reset link</Text>
            )}
          </Pressable>

          <Pressable onPress={handleDismiss} style={forgotStyles.cancelBtn}>
            <Text style={forgotStyles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const forgotStyles = StyleSheet.create({
  input: {
    width: "100%",
    backgroundColor: "#F9F7F4",
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  success: {
    color: "#5B7553",
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(91,117,83,0.10)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: "hidden",
    width: "100%",
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: "hidden",
    width: "100%",
  },
  sendBtn: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#D97706",
    borderRadius: 16,
    paddingVertical: 14,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: "#8A8F84",
    fontSize: 14,
  },
});

function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "The email address you entered isn't valid. Please check and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support for help.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "The email or password you entered is incorrect. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/weak-password":
      return "Your password must be at least 6 characters long.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Unable to connect. Please check your internet connection.";
    default:
      return "Something went wrong. Please try again.";
  }
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
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D8D0C4",
  },
  dividerText: {
    color: "#7B7F85",
    fontSize: 13,
    fontWeight: "500",
  },
  appleButton: {
    height: 52,
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
  forgotLink: {
    alignSelf: "flex-end",
  },
  forgotLinkText: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "600",
  },
  footnote: {
    color: "#7B7F85",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
