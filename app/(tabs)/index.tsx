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
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import UserAvatar from "@/components/UserAvatar";

type MemberInfo = { uid: string; displayName: string | null; email: string; role: string };

type PrayerRequest = {
  id: string;
  text: string;
  anonymous: boolean;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date | null;
  prayingFor: { uid: string; displayName: string | null }[];
};

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

function MyPrayersModal({
  visible,
  prayers,
  user,
  lang,
  timeAgo,
  onDelete,
  onTogglePraying,
  onDismiss,
}: {
  visible: boolean;
  prayers: PrayerRequest[];
  user: { uid: string; displayName: string | null } | null;
  lang: "en" | "de" | "vi";
  timeAgo: (date: Date | null) => string;
  onDelete: (id: string) => void;
  onTogglePraying: (prayer: PrayerRequest) => void;
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
            {t("prayer_my_requests", lang)}
          </Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {prayers.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
                <Ionicons name="heart-outline" size={32} color="#A3A89E" />
                <Text style={{ color: "#A3A89E", fontSize: 14, textAlign: "center" }}>
                  {t("prayer_my_empty", lang)}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {prayers.map((p) => {
                  const isPraying = p.prayingFor.some((x) => x.uid === user?.uid);
                  return (
                    <View key={p.id} style={myPrayerStyles.card}>
                      <View style={myPrayerStyles.header}>
                        <Text style={myPrayerStyles.time}>{timeAgo(p.createdAt)}</Text>
                        {p.anonymous && (
                          <Text style={myPrayerStyles.anonBadge}>
                            {t("prayer_anonymous_label", lang)}
                          </Text>
                        )}
                        <View style={{ flex: 1 }} />
                        <Pressable onPress={() => onDelete(p.id)} style={{ padding: 4 }}>
                          <Ionicons name="trash-outline" size={16} color="#DC2626" />
                        </Pressable>
                      </View>
                      <Text style={myPrayerStyles.text}>{p.text}</Text>
                      {p.prayingFor.length > 0 && (
                        <View style={myPrayerStyles.footer}>
                          <Ionicons name="heart" size={12} color="#C0956C" />
                          <Text style={myPrayerStyles.prayingCount}>
                            {p.prayingFor.length} {t("prayer_praying", lang).toLowerCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
          <Pressable onPress={handleDismiss} style={membersModalStyles.closeBtn}>
            <Text style={membersModalStyles.closeText}>{t("close", lang)}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const myPrayerStyles = StyleSheet.create({
  card: {
    backgroundColor: "#F9F7F4",
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  time: {
    color: "#A3A89E",
    fontSize: 11,
  },
  anonBadge: {
    color: "#8A8F84",
    fontSize: 11,
    fontStyle: "italic",
  },
  text: {
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prayingCount: {
    color: "#C0956C",
    fontSize: 12,
    fontWeight: "500",
  },
});

function OrgDashboard() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { lang } = useLanguage();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayerText, setPrayerText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sendingPrayer, setSendingPrayer] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showMyPrayers, setShowMyPrayers] = useState(false);

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

  // Real-time prayer requests
  useEffect(() => {
    if (!org) return;
    const q = query(
      collection(db, "organizations", org.orgId, "prayers"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setPrayers(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text || "",
          anonymous: d.data().anonymous || false,
          createdBy: d.data().createdBy || "",
          createdByName: d.data().createdByName || null,
          createdAt: d.data().createdAt?.toDate?.() || null,
          prayingFor: d.data().prayingFor || [],
        })),
      );
    });
    return unsub;
  }, [org]);

  async function handlePostPrayer() {
    if (!prayerText.trim() || !org || !user) return;
    setSendingPrayer(true);
    try {
      await addDoc(collection(db, "organizations", org.orgId, "prayers"), {
        text: prayerText.trim(),
        anonymous,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
        prayingFor: [],
      });
      setPrayerText("");
      setAnonymous(false);
    } catch {
      // ignore
    } finally {
      setSendingPrayer(false);
    }
  }

  async function handleDeletePrayer() {
    if (!org || !deleteTarget) return;
    await deleteDoc(doc(db, "organizations", org.orgId, "prayers", deleteTarget));
    setDeleteTarget(null);
  }

  async function togglePraying(prayer: PrayerRequest) {
    if (!org || !user) return;
    const ref = doc(db, "organizations", org.orgId, "prayers", prayer.id);
    const me = { uid: user.uid, displayName: user.displayName };
    const existing = prayer.prayingFor.find((p) => p.uid === user.uid);
    if (existing) {
      await updateDoc(ref, { prayingFor: arrayRemove(existing) });
    } else {
      await updateDoc(ref, { prayingFor: arrayUnion(me) });
    }
  }

  function timeAgo(date: Date | null): string {
    if (!date) return "";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return t("cal_just_now", lang);
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}${t("cal_minutes_ago", lang)}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${t("cal_hours_ago", lang)}`;
    const days = Math.floor(hours / 24);
    return `${days}${t("cal_days_ago", lang)}`;
  }

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

        {/* My Prayer Requests button */}
        <Pressable
          onPress={() => setShowMyPrayers(true)}
          style={styles.membersBtn}
        >
          <Ionicons name="heart" size={18} color="#C0956C" />
          <Text style={styles.membersBtnText}>
            {t("prayer_my_requests", lang)}
          </Text>
          {prayers.filter((p) => p.createdBy === user?.uid).length > 0 && (
            <View style={[styles.membersBadge, { backgroundColor: "#C0956C" }]}>
              <Text style={styles.membersBadgeText}>
                {prayers.filter((p) => p.createdBy === user?.uid).length}
              </Text>
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

      <MyPrayersModal
        visible={showMyPrayers}
        prayers={prayers.filter((p) => p.createdBy === user?.uid)}
        user={user}
        lang={lang}
        timeAgo={timeAgo}
        onDelete={setDeleteTarget}
        onTogglePraying={togglePraying}
        onDismiss={() => setShowMyPrayers(false)}
      />

      {/* Prayer Requests */}
      <View style={styles.prayerSection}>
        <Text style={styles.prayerSectionTitle}>{t("prayer_title", lang)}</Text>

        {/* Input */}
        <View style={styles.prayerInputCard}>
          <TextInput
            value={prayerText}
            onChangeText={setPrayerText}
            placeholder={t("prayer_placeholder", lang)}
            placeholderTextColor="#A3A89E"
            style={styles.prayerInput}
            multiline
          />
          <View style={styles.prayerInputActions}>
            <Pressable
              onPress={() => setAnonymous(!anonymous)}
              style={styles.anonToggle}
            >
              <Ionicons
                name={anonymous ? "checkbox" : "square-outline"}
                size={20}
                color={anonymous ? "#5B7553" : "#A3A89E"}
              />
              <Text style={[styles.anonText, anonymous && { color: "#5B7553" }]}>
                {t("prayer_anonymous", lang)}
              </Text>
            </Pressable>
            <Pressable
              onPress={handlePostPrayer}
              disabled={sendingPrayer || !prayerText.trim()}
              style={[
                styles.prayerSendBtn,
                (!prayerText.trim() || sendingPrayer) && { opacity: 0.4 },
              ]}
            >
              {sendingPrayer ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Prayer list */}
        {prayers.length === 0 ? (
          <View style={styles.prayerEmpty}>
            <Ionicons name="heart-outline" size={32} color="#A3A89E" />
            <Text style={styles.prayerEmptyText}>{t("prayer_empty", lang)}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {prayers.map((p) => {
              const isPraying = p.prayingFor.some((x) => x.uid === user?.uid);
              return (
                <View key={p.id} style={styles.prayerCard}>
                  <View style={styles.prayerHeader}>
                    {p.anonymous ? (
                      <View style={styles.anonAvatar}>
                        <Ionicons name="person" size={16} color="#A3A89E" />
                      </View>
                    ) : (
                      <UserAvatar uid={p.createdBy} name={p.createdByName} size={32} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prayerAuthor}>
                        {p.anonymous ? t("prayer_anonymous_label", lang) : (p.createdByName || "?")}
                      </Text>
                      <Text style={styles.prayerTime}>{timeAgo(p.createdAt)}</Text>
                    </View>
                    {p.createdBy === user?.uid && (
                      <Pressable onPress={() => setDeleteTarget(p.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      </Pressable>
                    )}
                  </View>
                  <Text style={styles.prayerText}>{p.text}</Text>
                  <View style={styles.prayerFooter}>
                    <Pressable
                      onPress={() => togglePraying(p)}
                      style={[
                        styles.prayingBtn,
                        isPraying && styles.prayingBtnActive,
                      ]}
                    >
                      <Ionicons
                        name={isPraying ? "heart" : "heart-outline"}
                        size={14}
                        color={isPraying ? "#FFFFFF" : "#C0956C"}
                      />
                      <Text
                        style={[
                          styles.prayingBtnText,
                          isPraying && styles.prayingBtnTextActive,
                        ]}
                      >
                        {t("prayer_praying", lang)}
                        {p.prayingFor.length > 0 ? ` (${p.prayingFor.length})` : ""}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Delete prayer confirm */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        title={t("delete_title", lang)}
        message={t("prayer_delete_msg", lang)}
        confirmText={t("delete", lang)}
        cancelText={t("cancel", lang)}
        onConfirm={handleDeletePrayer}
        onDismiss={() => setDeleteTarget(null)}
      />
    </View>
  );
}

function DeleteConfirmModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
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
      <Animated.View style={[delStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[delStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View style={delStyles.iconCircle}>
            <Ionicons name="trash-outline" size={28} color="#DC2626" />
          </View>
          <Text style={delStyles.title}>{title}</Text>
          <Text style={delStyles.message}>{message}</Text>
          <View style={delStyles.buttonRow}>
            <Pressable onPress={handleDismiss} style={delStyles.cancelBtn}>
              <Text style={delStyles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={delStyles.deleteBtn}>
              <Text style={delStyles.deleteBtnText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const delStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
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
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 14,
  },
  cancelText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 14,
  },
  deleteBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

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
  prayerSection: {
    gap: 12,
  },
  prayerSectionTitle: {
    color: "#2C3E2C",
    fontSize: 20,
    fontWeight: "700",
  },
  prayerInputCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 14,
    gap: 10,
  },
  prayerInput: {
    color: "#111827",
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: "top",
  },
  prayerInputActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  anonToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  anonText: {
    color: "#A3A89E",
    fontSize: 13,
    fontWeight: "500",
  },
  prayerSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5B7553",
    justifyContent: "center",
    alignItems: "center",
  },
  prayerEmpty: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 16,
    padding: 32,
    gap: 8,
  },
  prayerEmptyText: {
    color: "#A3A89E",
    fontSize: 15,
  },
  prayerCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 16,
    gap: 10,
  },
  prayerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  anonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  prayerAuthor: {
    color: "#2C3E2C",
    fontSize: 14,
    fontWeight: "600",
  },
  prayerTime: {
    color: "#A3A89E",
    fontSize: 11,
  },
  prayerText: {
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
  },
  prayerFooter: {
    flexDirection: "row",
  },
  prayingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(192,149,108,0.1)",
  },
  prayingBtnActive: {
    backgroundColor: "#C0956C",
  },
  prayingBtnText: {
    color: "#C0956C",
    fontSize: 13,
    fontWeight: "600",
  },
  prayingBtnTextActive: {
    color: "#FFFFFF",
  },
});
