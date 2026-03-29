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
  TextInput,
  View,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import UserAvatar from "@/components/UserAvatar";

type MemberInfo = { uid: string; displayName: string | null; email: string; role: string };

function ErrorModal({
  title,
  message,
  buttonText,
  onDismiss,
}: {
  title: string;
  message: string | null;
  buttonText: string;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (message) {
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
  }, [message, opacity, scale]);

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

  if (!message) return null;

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[modalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View style={modalStyles.iconCircle}>
            <Ionicons name="alert-circle" size={32} color="#DC2626" />
          </View>
          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>
          <Pressable onPress={handleDismiss} style={modalStyles.button}>
            <Text style={modalStyles.buttonText}>{buttonText}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
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

function JoinOrgView() {
  const { joinOrg } = useOrg();
  const { lang } = useLanguage();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!code.trim()) {
      setError(t("join_error_empty", lang));
      return;
    }
    setLoading(true);
    try {
      await joinOrg(code);
    } catch (err: any) {
      setError(err.message || t("firebase_default", lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>{t("auth_brand", lang)}</Text>
        <Text style={styles.title}>{t("join_title", lang)}</Text>
        <Text style={styles.body}>{t("join_desc", lang)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t("join_label", lang)}</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setCode}
            placeholder={t("join_placeholder", lang)}
            placeholderTextColor="#A3A89E"
            style={styles.input}
            value={code}
          />
        </View>

        <Pressable
          onPress={handleJoin}
          disabled={loading}
          style={[styles.joinButton, loading && { opacity: 0.7 }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.joinButtonText}>{t("join_button", lang)}</Text>
          )}
        </Pressable>
      </View>

      <ErrorModal
        title={t("join_error_title", lang)}
        message={error}
        buttonText={t("try_again", lang)}
        onDismiss={() => setError(null)}
      />
    </View>
  );
}

function MembersModal({
  visible,
  members,
  lang,
  onDismiss,
}: {
  visible: boolean;
  members: MemberInfo[];
  lang: "en" | "de" | "vi";
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
    }).start(() => onDismiss());
  }

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[membersModalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <Text style={membersModalStyles.title}>
            {t("home_members", lang)}
          </Text>
          <ScrollView style={{ maxHeight: 400 }}>
            <View style={{ gap: 12 }}>
              {members.map((m) => (
                <View key={m.uid} style={membersModalStyles.row}>
                  <UserAvatar uid={m.uid} name={m.displayName} email={m.email} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={membersModalStyles.name}>
                      {m.displayName || t("home_member_fallback", lang)}
                    </Text>
                    <Text style={membersModalStyles.role}>{m.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          <Pressable onPress={handleDismiss} style={membersModalStyles.closeBtn}>
            <Text style={membersModalStyles.closeText}>{t("close", lang)}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const membersModalStyles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    color: "#2C3E2C",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  name: {
    color: "#2C3E2C",
    fontSize: 16,
    fontWeight: "500",
  },
  role: {
    color: "#8D5B2D",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  closeBtn: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  closeText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
});

function OrgDashboard() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { lang } = useLanguage();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (!org) return;
    let cancelled = false;

    async function loadMembers() {
      try {
        const snap = await getDocs(
          collection(db, "organizations", org!.orgId, "members")
        );
        if (!cancelled) {
          setMembers(
            snap.docs.map((d) => ({
              uid: d.id,
              displayName: d.data().displayName,
              email: d.data().email,
              role: d.data().role,
            }))
          );
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [org]);

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>{org?.orgName}</Text>
        <Text style={styles.title}>
          {t("home_welcome", lang)}
          {user?.displayName ? `, ${user.displayName}` : ""}
        </Text>
        <Text style={styles.body}>{t("home_desc", lang)}</Text>

        {/* Members button */}
        <Pressable
          onPress={() => setShowMembers(true)}
          style={styles.membersBtn}
        >
          <Ionicons name="people" size={18} color="#5B7553" />
          <Text style={styles.membersBtnText}>
            {t("home_members", lang)}
          </Text>
          {!loadingMembers && (
            <View style={styles.membersBadge}>
              <Text style={styles.membersBadgeText}>{members.length}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color="#8A8F84" />
        </Pressable>
      </View>

      <MembersModal
        visible={showMembers}
        members={members}
        lang={lang}
        onDismiss={() => setShowMembers(false)}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { org, isLoading } = useOrg();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5B7553" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {org ? <OrgDashboard /> : <JoinOrgView />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  body: {
    color: "#6B7264",
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 22,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: "#2C3E2C",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 16,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  joinButton: {
    alignItems: "center",
    backgroundColor: "#5B7553",
    borderRadius: 18,
    paddingVertical: 16,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  membersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(91,117,83,0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  membersBtnText: {
    color: "#2C3E2C",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  membersBadge: {
    backgroundColor: "#5B7553",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  membersBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
