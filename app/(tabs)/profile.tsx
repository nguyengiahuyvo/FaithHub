import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import { useLanguage } from "@/lib/language-context";
import { t, languageLabels, type Language } from "@/lib/i18n";

type ModalType = "confirm" | "error" | null;

function SignOutModal({
  type,
  onDismiss,
  onConfirm,
  loading,
  lang,
}: {
  type: ModalType;
  onDismiss: () => void;
  onConfirm: () => void;
  loading: boolean;
  lang: Language;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (type) {
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
  }, [type, opacity, scale]);

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

  if (!type) return null;

  const isError = type === "error";

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[modalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View
            style={[
              modalStyles.iconCircle,
              isError && { backgroundColor: "#FEF2F2" },
            ]}
          >
            <Ionicons
              name={isError ? "alert-circle" : "log-out-outline"}
              size={32}
              color={isError ? "#DC2626" : "#DC2626"}
            />
          </View>

          <Text style={modalStyles.title}>
            {isError ? t("profile_signout_failed", lang) : t("profile_signout_title", lang)}
          </Text>
          <Text style={modalStyles.message}>
            {isError
              ? t("profile_signout_error", lang)
              : t("profile_signout_msg", lang)}
          </Text>

          {isError ? (
            <Pressable onPress={handleDismiss} style={modalStyles.primaryButton}>
              <Text style={modalStyles.primaryButtonText}>{t("try_again", lang)}</Text>
            </Pressable>
          ) : (
            <View style={modalStyles.buttonRow}>
              <Pressable
                onPress={handleDismiss}
                disabled={loading}
                style={modalStyles.cancelButton}
              >
                <Text style={modalStyles.cancelButtonText}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                disabled={loading}
                style={[
                  modalStyles.confirmButton,
                  loading && { opacity: 0.7 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={modalStyles.confirmButtonText}>{t("profile_signout", lang)}</Text>
                )}
              </Pressable>
            </View>
          )}
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
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 14,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryButton: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#1F3B2E",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default function ProfileScreen() {
  const { user } = useAuth();
  const { org, leaveOrg } = useOrg();
  const { lang, setLang } = useLanguage();
  const [modalType, setModalType] = useState<ModalType>(null);
  const [signingOut, setSigningOut] = useState(false);

  const initials = (user?.displayName ?? user?.email ?? "?")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch {
      setSigningOut(false);
      setModalType("error");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {user?.displayName || t("profile_member_fallback", lang)}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("profile_account", lang)}</Text>

        <View style={styles.row}>
          <Ionicons name="person-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_display_name", lang)}</Text>
          <Text style={styles.rowValue}>
            {user?.displayName || t("profile_not_set", lang)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="mail-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_email", lang)}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_account_id", lang)}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {user?.uid.slice(0, 12)}...
          </Text>
        </View>
      </View>

      {org && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("profile_org", lang)}</Text>

          <View style={styles.row}>
            <Ionicons name="business-outline" size={20} color="#5B7553" />
            <Text style={styles.rowLabel}>{org.orgName}</Text>
            <Text style={styles.rowValue}>{org.role}</Text>
          </View>

          <View style={styles.separator} />

          <Pressable onPress={leaveOrg} style={styles.row}>
            <Ionicons name="exit-outline" size={20} color="#DC2626" />
            <Text style={[styles.rowLabel, { color: "#DC2626" }]}>
              {t("profile_leave_org", lang)}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("profile_preferences", lang)}</Text>

        <View style={styles.row}>
          <Ionicons name="language-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_language", lang)}</Text>
        </View>
        <View style={styles.langRow}>
          {(["en", "de", "vi"] as Language[]).map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={[
                styles.langChip,
                lang === l && styles.langChipActive,
              ]}
            >
              <Text
                style={[
                  styles.langChipText,
                  lang === l && styles.langChipTextActive,
                ]}
              >
                {languageLabels[l]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_notifications", lang)}</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="moon-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_appearance", lang)}</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </View>

      <Pressable
        onPress={() => setModalType("confirm")}
        style={styles.signOutButton}
      >
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.signOutText}>{t("profile_signout", lang)}</Text>
      </Pressable>

      <Text style={styles.version}>FaithHub v1.0.0</Text>

      <SignOutModal
        type={modalType}
        onDismiss={() => setModalType(null)}
        onConfirm={confirmSignOut}
        loading={signingOut}
        lang={lang}
      />
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
    backgroundColor: "#5B7553",
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
    color: "#2C3E2C",
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    color: "#8A8F84",
    fontSize: 15,
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 16,
  },
  sectionLabel: {
    color: "#A3A89E",
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
    color: "#2C3E2C",
    fontSize: 15,
    fontWeight: "500",
  },
  rowValue: {
    color: "#8A8F84",
    fontSize: 14,
    maxWidth: 160,
    textAlign: "right",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
    marginVertical: 8,
  },
  langRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  langChipActive: {
    backgroundColor: "#5B7553",
  },
  langChipText: {
    color: "#6B7264",
    fontSize: 14,
    fontWeight: "500",
  },
  langChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.6)",
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
    color: "#A3A89E",
    fontSize: 13,
    textAlign: "center",
  },
});
