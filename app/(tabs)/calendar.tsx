import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { t, tArray } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import { useOrg } from "@/lib/org-context";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Attendee = {
  uid: string;
  displayName: string | null;
};

type Comment = {
  id: string;
  text: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date | null;
};

type CalEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  createdBy: string;
  createdByName: string | null;
  attendees: Attendee[];
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { lang } = useLanguage();
  const MONTHS = tArray("cal_months", lang);
  const DAYS = tArray("cal_days", lang);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0],
  );

  useEffect(() => {
    if (!org) return;
    const unsub = onSnapshot(
      collection(db, "organizations", org.orgId, "events"),
      (snap) => {
        setEvents(
          snap.docs.map((d) => ({
            id: d.id,
            title: d.data().title,
            description: d.data().description || "",
            date: d.data().date,
            time: d.data().time || "",
            createdBy: d.data().createdBy || "",
            createdByName: d.data().createdByName || null,
            attendees: d.data().attendees || [],
          })),
        );
        setLoading(false);
      },
    );
    return unsub;
  }, [org]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayStr = today.toISOString().split("T")[0];

  const eventsForDate = events.filter((e) => e.date === selectedDate);

  function dateStr(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  }

  function eventCountForDay(day: number) {
    const ds = dateStr(day);
    return events.filter((e) => e.date === ds).length;
  }

  async function toggleAttend(eventId: string, attendees: Attendee[]) {
    if (!org || !user) return;
    const ref = doc(db, "organizations", org.orgId, "events", eventId);
    const already = attendees.some((a) => a.uid === user.uid);
    const me: Attendee = { uid: user.uid, displayName: user.displayName };
    if (already) {
      const existing = attendees.find((a) => a.uid === user.uid)!;
      await updateDoc(ref, { attendees: arrayRemove(existing) });
    } else {
      await updateDoc(ref, { attendees: arrayUnion(me) });
    }
  }

  async function handleDeleteEvent() {
    if (!org || !deleteTarget) return;
    await deleteDoc(
      doc(db, "organizations", org.orgId, "events", deleteTarget),
    );
    setDeleteTarget(null);
  }

  if (!org) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("cal_title", lang)}</Text>
          <Pressable
            onPress={() => setShowCreate(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator
            color="#5B7553"
            size="large"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {/* Month navigation */}
            <View style={styles.monthNav}>
              <Pressable onPress={prevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color="#2C3E2C" />
              </Pressable>
              <Text style={styles.monthLabel}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <Pressable onPress={nextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color="#2C3E2C" />
              </Pressable>
            </View>

            {/* Day headers */}
            <View style={styles.dayHeaderRow}>
              {DAYS.map((d) => (
                <Text key={d} style={styles.dayHeader}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calGrid}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const ds = dateStr(day);
                const isToday = ds === todayStr;
                const isSelected = ds === selectedDate;
                const count = eventCountForDay(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDate(ds)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.dayTextToday,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[styles.dot, isSelected && styles.dotSelected]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Events for selected date */}
            <Text style={styles.dateLabel}>{selectedDate}</Text>
            {eventsForDate.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t("cal_no_events", lang)}</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {eventsForDate.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    orgId={org.orgId}
                    user={user}
                    lang={lang}
                    onToggleAttend={toggleAttend}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <CreateEventModal
        visible={showCreate}
        orgId={org.orgId}
        userId={user?.uid ?? ""}
        userName={user?.displayName ?? null}
        defaultDate={selectedDate}
        lang={lang}
        onDismiss={() => setShowCreate(false)}
      />

      <DeleteConfirmModal
        visible={!!deleteTarget}
        title={t("delete_title", lang)}
        message={t("delete_event_msg", lang)}
        confirmText={t("delete", lang)}
        cancelText={t("cancel", lang)}
        onConfirm={handleDeleteEvent}
        onDismiss={() => setDeleteTarget(null)}
      />
    </View>
  );
}

function timeAgo(date: Date | null, lang: "en" | "de" | "vi"): string {
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

function EventCard({
  event: ev,
  orgId,
  user,
  lang,
  onToggleAttend,
  onDelete,
}: {
  event: CalEvent;
  orgId: string;
  user: { uid: string; displayName: string | null } | null;
  lang: "en" | "de" | "vi";
  onToggleAttend: (eventId: string, attendees: Attendee[]) => void;
  onDelete: (eventId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(
    null,
  );

  // Always listen for comment count
  useEffect(() => {
    const commentsRef = collection(
      db,
      "organizations",
      orgId,
      "events",
      ev.id,
      "comments",
    );
    const unsub = onSnapshot(commentsRef, (snap) => {
      setCommentCount(snap.size);
    });
    return unsub;
  }, [orgId, ev.id]);

  // Load full comments when expanded
  useEffect(() => {
    if (!showComments) return;
    const q = query(
      collection(db, "organizations", orgId, "events", ev.id, "comments"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text || "",
          createdBy: d.data().createdBy || "",
          createdByName: d.data().createdByName || null,
          createdAt: d.data().createdAt?.toDate?.() || null,
        })),
      );
    });
    return unsub;
  }, [showComments, orgId, ev.id]);

  async function handleDeleteComment() {
    if (!deleteCommentTarget) return;
    try {
      await deleteDoc(
        doc(
          db,
          "organizations",
          orgId,
          "events",
          ev.id,
          "comments",
          deleteCommentTarget,
        ),
      );
    } catch {
      // ignore
    }
    setDeleteCommentTarget(null);
  }

  async function handleSendComment() {
    if (!commentText.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(
        collection(db, "organizations", orgId, "events", ev.id, "comments"),
        {
          text: commentText.trim(),
          createdBy: user.uid,
          createdByName: user.displayName,
          createdAt: serverTimestamp(),
        },
      );
      setCommentText("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  const isAttending = ev.attendees.some((a) => a.uid === user?.uid);
  const count = ev.attendees.length;

  return (
    <View style={styles.eventCard}>
      {/* Top row: time badge + title/desc + delete */}
      <View style={styles.eventTopRow}>
        <View style={styles.eventTimeBadge}>
          <Text style={styles.eventTime}>
            {ev.time || t("cal_all_day", lang)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle}>{ev.title}</Text>
          {ev.description ? (
            <Text style={styles.eventDesc}>{ev.description}</Text>
          ) : null}
          {ev.createdByName ? (
            <View style={styles.creatorRow}>
              <UserAvatar
                uid={ev.createdBy}
                name={ev.createdByName}
                size={16}
              />
              <Text style={styles.eventMeta}>
                {t("tasks_by", lang)} {ev.createdByName}
              </Text>
            </View>
          ) : null}
        </View>
        {ev.createdBy === user?.uid && (
          <Pressable
            onPress={() => onDelete(ev.id)}
            style={styles.eventDeleteBtn}
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
          </Pressable>
        )}
      </View>

      {/* Attendees — full width */}
      {count > 0 && (
        <View style={styles.attendeeRow}>
          {ev.attendees.slice(0, 5).map((a) => (
            <View key={a.uid} style={styles.attendeeBubbleWrap}>
              <UserAvatar uid={a.uid} name={a.displayName} size={26} />
            </View>
          ))}
          <Text style={styles.attendeeCount}>
            {count}{" "}
            {count === 1 ? t("cal_attendee", lang) : t("cal_attendees", lang)}
          </Text>
        </View>
      )}

      {/* Attend button + Comments toggle — full width */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={() => onToggleAttend(ev.id, ev.attendees)}
          style={[
            styles.attendBtn,
            isAttending && styles.attendBtnActive,
            { marginTop: 0 },
          ]}
        >
          <Ionicons
            name={isAttending ? "checkmark-circle" : "hand-right-outline"}
            size={16}
            color={isAttending ? "#FFFFFF" : "#5B7553"}
          />
          <Text
            style={[
              styles.attendBtnText,
              isAttending && styles.attendBtnTextActive,
            ]}
          >
            {isAttending ? t("cal_attending", lang) : t("cal_attend", lang)}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowComments(!showComments)}
          style={[
            styles.attendBtn,
            showComments && styles.attendBtnActive,
            { marginTop: 0 },
          ]}
        >
          <Ionicons
            name="chatbubble-outline"
            size={14}
            color={showComments ? "#FFFFFF" : "#5B7553"}
          />
          <Text
            style={[
              styles.attendBtnText,
              showComments && styles.attendBtnTextActive,
            ]}
          >
            {t("cal_comments", lang)}
            {commentCount > 0 ? ` (${commentCount})` : ""}
          </Text>
        </Pressable>
      </View>

      <DeleteConfirmModal
        visible={!!deleteCommentTarget}
        title={t("delete_title", lang)}
        message={t("cal_delete_comment_msg", lang)}
        confirmText={t("delete", lang)}
        cancelText={t("cancel", lang)}
        onConfirm={handleDeleteComment}
        onDismiss={() => setDeleteCommentTarget(null)}
      />

      {/* Comments section — full width */}
      {showComments && (
        <View style={commentStyles.container}>
          {comments.length === 0 ? (
            <Text style={commentStyles.empty}>
              {t("cal_no_comments", lang)}
            </Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={commentStyles.comment}>
                <UserAvatar
                  uid={c.createdBy}
                  name={c.createdByName}
                  size={28}
                />
                <View style={{ flex: 1 }}>
                  <View style={commentStyles.commentHeader}>
                    <Text style={commentStyles.commentAuthor}>
                      {c.createdByName || "?"}
                    </Text>
                    <Text style={commentStyles.commentTime}>
                      {timeAgo(c.createdAt, lang)}
                    </Text>
                  </View>
                  <Text style={commentStyles.commentText}>{c.text}</Text>
                </View>
                {c.createdBy === user?.uid && (
                  <Pressable
                    onPress={() => setDeleteCommentTarget(c.id)}
                    style={commentStyles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={14} color="#DC2626" />
                  </Pressable>
                )}
              </View>
            ))
          )}

          {/* Comment input */}
          <View style={commentStyles.inputRow}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder={t("cal_add_comment", lang)}
              placeholderTextColor="#A3A89E"
              style={commentStyles.input}
              multiline
            />
            <Pressable
              onPress={handleSendComment}
              disabled={sending || !commentText.trim()}
              style={[
                commentStyles.sendBtn,
                (!commentText.trim() || sending) && { opacity: 0.4 },
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function CreateEventModal({
  visible,
  orgId,
  userId,
  userName,
  defaultDate,
  lang,
  onDismiss,
}: {
  visible: boolean;
  orgId: string;
  userId: string;
  userName: string | null;
  defaultDate: string;
  lang: "en" | "de" | "vi";
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(defaultDate);
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
  }, [visible, defaultDate, opacity, scale]);

  function handleDismiss() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setTitle("");
      setDescription("");
      setTime("");
      onDismiss();
    });
  }

  async function handleCreate() {
    if (!title.trim() || !date.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "organizations", orgId, "events"), {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        time: time.trim(),
        createdBy: userId,
        createdByName: userName,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setDescription("");
      setTime("");
      onDismiss();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none">
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <Animated.View style={[mStyles.backdrop, { opacity }]}>
          <Animated.View
            style={[mStyles.card, { opacity, transform: [{ scale }] }]}
          >
            <Text style={mStyles.modalTitle}>{t("cal_new", lang)}</Text>

            <View style={mStyles.field}>
              <Text style={mStyles.label}>{t("tasks_title_label", lang)}</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("cal_event_name", lang)}
                placeholderTextColor="#A3A89E"
                style={mStyles.input}
              />
            </View>

            <View style={mStyles.fieldRow}>
              <View style={[mStyles.field, { flex: 1 }]}>
                <Text style={mStyles.label}>{t("cal_date", lang)}</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A3A89E"
                  style={mStyles.input}
                />
              </View>
              <View style={[mStyles.field, { flex: 1 }]}>
                <Text style={mStyles.label}>{t("cal_time", lang)}</Text>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder={t("cal_time_placeholder", lang)}
                  placeholderTextColor="#A3A89E"
                  style={mStyles.input}
                />
              </View>
            </View>

            <View style={mStyles.field}>
              <Text style={mStyles.label}>{t("tasks_desc_label", lang)}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t("tasks_desc_placeholder", lang)}
                placeholderTextColor="#A3A89E"
                style={[
                  mStyles.input,
                  { minHeight: 70, textAlignVertical: "top" },
                ]}
                multiline
              />
            </View>

            <View style={mStyles.buttonRow}>
              <Pressable onPress={handleDismiss} style={mStyles.cancelBtn}>
                <Text style={mStyles.cancelText}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={saving || !title.trim()}
                style={[
                  mStyles.createBtn,
                  (saving || !title.trim()) && { opacity: 0.6 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={mStyles.createText}>{t("create", lang)}</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
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
      <Animated.View style={[mStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[mStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View style={delStyles.iconCircle}>
            <Ionicons name="trash-outline" size={28} color="#DC2626" />
          </View>
          <Text style={delStyles.title}>{title}</Text>
          <Text style={delStyles.message}>{message}</Text>
          <View style={mStyles.buttonRow}>
            <Pressable onPress={handleDismiss} style={mStyles.cancelBtn}>
              <Text style={mStyles.cancelText}>{cancelText}</Text>
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

const mStyles = StyleSheet.create({
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
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    color: "#2C3E2C",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  field: { gap: 6 },
  fieldRow: { flexDirection: "row", gap: 12 },
  label: {
    color: "#2C3E2C",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#F9F7F4",
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  createBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#5B7553",
    borderRadius: 16,
    paddingVertical: 14,
  },
  createText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 60,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#2C3E2C",
    fontSize: 30,
    fontWeight: "700",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#5B7553",
    justifyContent: "center",
    alignItems: "center",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel: {
    color: "#2C3E2C",
    fontSize: 18,
    fontWeight: "700",
  },
  dayHeaderRow: {
    flexDirection: "row",
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    color: "#A3A89E",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 8,
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 8,
    gap: 3,
  },
  dayCellSelected: {
    backgroundColor: "#5B7553",
    borderRadius: 12,
  },
  dayText: {
    color: "#2C3E2C",
    fontSize: 15,
    fontWeight: "500",
  },
  dayTextToday: {
    color: "#8D5B2D",
    fontWeight: "700",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#5B7553",
  },
  dotSelected: {
    backgroundColor: "#FFFFFF",
  },
  dateLabel: {
    color: "#8A8F84",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 16,
    padding: 24,
  },
  emptyText: {
    color: "#A3A89E",
    fontSize: 15,
  },
  eventCard: {
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 16,
  },
  eventTopRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  eventTimeBadge: {
    backgroundColor: "rgba(91,117,83,0.12)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  eventTime: {
    color: "#5B7553",
    fontSize: 13,
    fontWeight: "700",
  },
  eventTitle: {
    color: "#2C3E2C",
    fontSize: 16,
    fontWeight: "600",
  },
  eventDesc: {
    color: "#6B7264",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  eventMeta: {
    color: "#A3A89E",
    fontSize: 12,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  attendeeBubbleWrap: {
    marginRight: -4,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  attendeeCount: {
    color: "#8A8F84",
    fontSize: 12,
    marginLeft: 8,
  },
  attendBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(91,117,83,0.1)",
  },
  attendBtnActive: {
    backgroundColor: "#5B7553",
  },
  attendBtnText: {
    color: "#5B7553",
    fontSize: 13,
    fontWeight: "600",
  },
  attendBtnTextActive: {
    color: "#FFFFFF",
  },
  eventDeleteBtn: {
    padding: 6,
    alignSelf: "flex-start",
  },
});

const commentStyles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    gap: 10,
  },
  empty: {
    color: "#A3A89E",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
  comment: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentAuthor: {
    color: "#2C3E2C",
    fontSize: 13,
    fontWeight: "600",
  },
  commentTime: {
    color: "#A3A89E",
    fontSize: 11,
  },
  commentText: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    marginTop: 4,
  },
  input: {
    flex: 1,
    backgroundColor: "#F9F7F4",
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    color: "#111827",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5B7553",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    padding: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
});
