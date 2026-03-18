import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";

export default function VerifyEmailScreen() {
  const { user, refreshUser } = useAuth();
  const { lang } = useLanguage();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleResend() {
    if (!user) return;
    setResending(true);
    setResent(false);
    setErrorMsg(null);
    try {
      await sendEmailVerification(user);
      setResent(true);
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  }

  async function handleCheck() {
    if (!user) return;
    setChecking(true);
    setErrorMsg(null);
    try {
      await refreshUser();
      if (!auth.currentUser?.emailVerified) {
        setErrorMsg(t("verify_not_yet", lang));
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={36} color="#5B7553" />
        </View>
        <Text style={styles.title}>{t("verify_title", lang)}</Text>
        <Text style={styles.desc}>
          {t("verify_desc", lang)}
        </Text>
        {user?.email ? (
          <Text style={styles.email}>{user.email}</Text>
        ) : null}

        {errorMsg ? (
          <Text style={styles.error}>{errorMsg}</Text>
        ) : null}

        {resent ? (
          <Text style={styles.success}>{t("verify_resent", lang)}</Text>
        ) : null}

        <Pressable
          onPress={handleCheck}
          disabled={checking}
          style={styles.primaryBtn}
        >
          {checking ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {t("verify_check", lang)}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleResend}
          disabled={resending}
          style={styles.secondaryBtn}
        >
          {resending ? (
            <ActivityIndicator color="#5B7553" size="small" />
          ) : (
            <Text style={styles.secondaryBtnText}>
              {t("verify_resend", lang)}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>{t("verify_signout", lang)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F9F7F4",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(91,117,83,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: "#1F2A1F",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: {
    color: "#5C625C",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  email: {
    color: "#5B7553",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
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
  primaryBtn: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#5B7553",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(91,117,83,0.10)",
    borderRadius: 16,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    color: "#5B7553",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutBtn: {
    paddingVertical: 8,
  },
  signOutText: {
    color: "#A3A89E",
    fontSize: 14,
  },
});
