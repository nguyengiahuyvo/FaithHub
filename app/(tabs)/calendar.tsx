import UserAvatar from "@/components/UserAvatar";
import Snackbar from "@/components/Snackbar";
import TasksScreen from "./tasks";
import { useAuth } from "@/lib/auth-context";
import { notifyOrgOfNewEvent } from "@/lib/notifications";
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
import {ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,} from "react-native";
import { Pressable } from "@/components/HapticPressable";

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

type RepeatRule = "none" | "daily" | "weekly" | "yearly";

type CalEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD (base/first occurrence)
  time: string; // HH:MM
  createdBy: string;
  createdByName: string | null;
  attendees: Attendee[];
  maybe: Attendee[];
  repeat: RepeatRule;
  repeatUntil: string | null; // YYYY-MM-DD — null = no end (yearly/birthday)
  isBirthday: boolean;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert from Sun=0 to Mon=0: (day + 6) % 7
  return (day + 6) % 7;
}

// Parse a YYYY-MM-DD string into a Date at local midnight — avoids the
// UTC-shift bug that `new Date("YYYY-MM-DD")` triggers near timezone edges.
function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Returns true if the event has an occurrence on the given date.
function eventOccursOn(ev: CalEvent, dateStr: string): boolean {
  const rule = ev.repeat || "none";
  if (rule === "none") return ev.date === dateStr;
  if (dateStr < ev.date) return false;
  if (ev.repeatUntil && dateStr > ev.repeatUntil) return false;

  if (rule === "yearly") {
    // Match MM-DD (allows birthdays to recur across all future years).
    return ev.date.slice(5) === dateStr.slice(5);
  }
  if (rule === "daily") return true;
  if (rule === "weekly") {
    const base = parseDate(ev.date).getTime();
    const target = parseDate(dateStr).getTime();
    const days = Math.round((target - base) / 86_400_000);
    return days >= 0 && days % 7 === 0;
  }
  return false;
}

// Next occurrence date >= fromStr, or null if none.
function nextOccurrence(ev: CalEvent, fromStr: string): string | null {
  const rule = ev.repeat || "none";
  if (rule === "none") return ev.date >= fromStr ? ev.date : null;

  if (rule === "yearly") {
    const fromYear = parseInt(fromStr.slice(0, 4), 10);
    const mmdd = ev.date.slice(5);
    const baseYear = parseInt(ev.date.slice(0, 4), 10);
    for (let y = Math.max(fromYear, baseYear); y <= fromYear + 2; y++) {
      const cand = `${y}-${mmdd}`;
      if (cand >= fromStr) return cand;
    }
    return null;
  }

  // Daily / weekly are capped by repeatUntil.
  if (ev.repeatUntil && fromStr > ev.repeatUntil) return null;
  const base = parseDate(ev.date);
  const from = parseDate(fromStr);
  const start = from > base ? from : base;

  if (rule === "daily") {
    const cand = formatDateStr(start);
    if (ev.repeatUntil && cand > ev.repeatUntil) return null;
    return cand;
  }
  if (rule === "weekly") {
    const deltaDays = Math.round(
      (start.getTime() - base.getTime()) / 86_400_000,
    );
    const remainder = ((deltaDays % 7) + 7) % 7;
    const offset = remainder === 0 ? 0 : 7 - remainder;
    const next = new Date(start.getTime() + offset * 86_400_000);
    const cand = formatDateStr(next);
    if (ev.repeatUntil && cand > ev.repeatUntil) return null;
    return cand;
  }
  return null;
}

function CalendarEventsView() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { lang } = useLanguage();
  const MONTHS = tArray("cal_months", lang);
  const DAYS = tArray("cal_days", lang);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const snackOpacity = useRef(new Animated.Value(0)).current;

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
            maybe: d.data().maybe || [],
            repeat: (d.data().repeat as RepeatRule) || "none",
            repeatUntil: d.data().repeatUntil || null,
            isBirthday: !!d.data().isBirthday,
          })),
        );
        setLoading(false);
      },
      () => {},
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

  const eventsForDate = events.filter((e) => eventOccursOn(e, selectedDate));

  // Find all upcoming events on the nearest future date. Expand recurring
  // events to their next occurrence instead of comparing raw stored dates.
  const upcomingEvents: { ev: CalEvent; date: string }[] = (() => {
    const withNext: { ev: CalEvent; date: string }[] = [];
    for (const e of events) {
      const next = nextOccurrence(e, todayStr);
      if (next) withNext.push({ ev: e, date: next });
    }
    if (withNext.length === 0) return [];
    withNext.sort((a, b) => a.date.localeCompare(b.date));
    const nearestDate = withNext[0].date;
    return withNext
      .filter((x) => x.date === nearestDate)
      .sort((a, b) =>
        (a.ev.time || "99:99").localeCompare(b.ev.time || "99:99"),
      );
  })();

  function dateStr(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  }

  function eventCountForDay(day: number) {
    const ds = dateStr(day);
    return events.filter((e) => eventOccursOn(e, ds)).length;
  }

  async function toggleAttend(eventId: string, ev: CalEvent) {
    if (!org || !user) return;
    const ref = doc(db, "organizations", org.orgId, "events", eventId);
    const already = ev.attendees.some((a) => a.uid === user.uid);
    const me: Attendee = { uid: user.uid, displayName: user.displayName };
    if (already) {
      const existing = ev.attendees.find((a) => a.uid === user.uid)!;
      await updateDoc(ref, { attendees: arrayRemove(existing) });
    } else {
      // Remove from maybe if switching to attend
      const inMaybe = ev.maybe.find((a) => a.uid === user.uid);
      const updates: Record<string, unknown> = { attendees: arrayUnion(me) };
      if (inMaybe) updates.maybe = arrayRemove(inMaybe);
      await updateDoc(ref, updates);
    }
  }

  async function toggleMaybe(eventId: string, ev: CalEvent) {
    if (!org || !user) return;
    const ref = doc(db, "organizations", org.orgId, "events", eventId);
    const already = ev.maybe.some((a) => a.uid === user.uid);
    const me: Attendee = { uid: user.uid, displayName: user.displayName };
    if (already) {
      const existing = ev.maybe.find((a) => a.uid === user.uid)!;
      await updateDoc(ref, { maybe: arrayRemove(existing) });
    } else {
      // Remove from attendees if switching to maybe
      const inAttend = ev.attendees.find((a) => a.uid === user.uid);
      const updates: Record<string, unknown> = { maybe: arrayUnion(me) };
      if (inAttend) updates.attendees = arrayRemove(inAttend);
      await updateDoc(ref, updates);
    }
  }

  function showSnack(msg: string) {
    setSnackMsg(msg);
    snackOpacity.setValue(0);
    Animated.timing(snackOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(snackOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setSnackMsg(null));
      }, 3000);
    });
  }

  async function handleDeleteEvent() {
    if (!org || !deleteTarget) return;
    await deleteDoc(
      doc(db, "organizations", org.orgId, "events", deleteTarget),
    );
    setDeleteTarget(null);
    showSnack(t("snack_deleted", lang));
  }

  if (!org) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
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
            {/* Upcoming events */}
            {upcomingEvents.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={styles.upcomingLabel}>{t("cal_upcoming", lang)}</Text>
                {upcomingEvents.map(({ ev, date: nextDate }) => (
                  <Pressable
                    key={ev.id}
                    onPress={() => {
                      setSelectedDate(nextDate);
                      const [y, m] = nextDate.split("-").map(Number);
                      setViewYear(y);
                      setViewMonth(m - 1);
                    }}
                    style={styles.upcomingCard}
                  >
                    <View style={styles.upcomingIconWrap}>
                      <Ionicons
                        name={ev.isBirthday ? "gift" : "calendar"}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upcomingTitle} numberOfLines={1}>{ev.title}</Text>
                      <Text style={styles.upcomingMeta}>
                        {nextDate}
                        {ev.time ? ` · ${ev.time}` : ""}
                        {ev.attendees.length > 0
                          ? ` · ${ev.attendees.length} ${ev.attendees.length === 1 ? t("cal_attendee", lang) : t("cal_attendees", lang)}`
                          : ""}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#5B7553" />
                  </Pressable>
                ))}
              </View>
            )}

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

            {/* Calendar card */}
            <View style={styles.calCard}>
              {/* Day headers */}
              <View style={styles.dayHeaderRow}>
                {DAYS.map((d, i) => (
                  <Text
                    key={d}
                    style={[
                      styles.dayHeader,
                      i >= 5 && styles.dayHeaderWeekend,
                    ]}
                  >
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
                  // Calculate column index (0-6) for weekend styling
                  const col = (firstDay + i) % 7;
                  const isWeekend = col >= 5;
                  return (
                    <Pressable
                      key={day}
                      onPress={() => setSelectedDate(ds)}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isWeekend && styles.dayTextWeekend,
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
                    onToggleMaybe={toggleMaybe}
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

      <Snackbar message={snackMsg} opacity={snackOpacity} />
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
  onToggleMaybe,
  onDelete,
}: {
  event: CalEvent;
  orgId: string;
  user: { uid: string; displayName: string | null } | null;
  lang: "en" | "de" | "vi";
  onToggleAttend: (eventId: string, ev: CalEvent) => void;
  onToggleMaybe: (eventId: string, ev: CalEvent) => void;
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
  const [showAttendees, setShowAttendees] = useState(false);

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
    }, () => {});
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
    }, () => {});
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
  const isMaybe = ev.maybe.some((a) => a.uid === user?.uid);
  const count = ev.attendees.length;

  return (
    <View style={styles.eventCard}>
      {/* Top row: time badge + title/desc + delete */}
      <View style={styles.eventTopRow}>
        <View style={styles.eventTimeBadge}>
          {ev.isBirthday ? (
            <Ionicons name="gift" size={16} color="#5B7553" />
          ) : (
            <Text style={styles.eventTime}>
              {ev.time || t("cal_all_day", lang)}
            </Text>
          )}
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
        <Pressable onPress={() => setShowAttendees(true)} style={styles.attendeeRow}>
          {ev.attendees.slice(0, 5).map((a) => (
            <View key={a.uid} style={styles.attendeeBubbleWrap}>
              <UserAvatar uid={a.uid} name={a.displayName} size={26} />
            </View>
          ))}
          <Text style={styles.attendeeCount}>
            {count}{" "}
            {count === 1 ? t("cal_attendee", lang) : t("cal_attendees", lang)}
          </Text>
          {count > 5 && (
            <Ionicons name="chevron-forward" size={14} color="#8A8F84" />
          )}
        </Pressable>
      )}

      {/* Attendees list modal */}
      <AttendeesModal
        visible={showAttendees}
        attendees={ev.attendees}
        lang={lang}
        onDismiss={() => setShowAttendees(false)}
      />

      {/* Attend + Maybe + Comments — full width */}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Pressable
          onPress={() => onToggleAttend(ev.id, ev)}
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
          onPress={() => onToggleMaybe(ev.id, ev)}
          style={[
            styles.attendBtn,
            isMaybe && styles.maybeBtnActive,
            { marginTop: 0 },
          ]}
        >
          <Ionicons
            name={isMaybe ? "help-circle" : "help-circle-outline"}
            size={16}
            color={isMaybe ? "#FFFFFF" : "#C0956C"}
          />
          <Text
            style={[
              styles.attendBtnText,
              { color: "#C0956C" },
              isMaybe && styles.maybeBtnTextActive,
            ]}
          >
            {isMaybe ? t("cal_interested", lang) : t("cal_maybe", lang)}
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

function AttendeesModal({
  visible,
  attendees,
  lang,
  onDismiss,
}: {
  visible: boolean;
  attendees: Attendee[];
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
      <Animated.View style={[mStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[mStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <Text style={mStyles.modalTitle}>
            {t("cal_attendees_title", lang)}
          </Text>
          <ScrollView style={{ maxHeight: 320 }}>
            <View style={{ gap: 10 }}>
              {attendees.map((a) => (
                <View key={a.uid} style={attendeeModalStyles.row}>
                  <UserAvatar uid={a.uid} name={a.displayName} size={36} />
                  <Text style={attendeeModalStyles.name}>
                    {a.displayName || "?"}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <Pressable onPress={handleDismiss} style={attendeeModalStyles.closeBtn}>
            <Text style={attendeeModalStyles.closeText}>{t("close", lang)}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const attendeeModalStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  name: {
    color: "#2C3E2C",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
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
  const [isBirthday, setIsBirthday] = useState(false);
  const [repeat, setRepeat] = useState<RepeatRule>("none");
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
      setIsBirthday(false);
      setRepeat("none");
      onDismiss();
    });
  }

  async function handleCreate() {
    if (!title.trim() || !date.trim()) return;
    setSaving(true);
    // Birthday events: always yearly, never end, no time.
    const effectiveRepeat: RepeatRule = isBirthday ? "yearly" : repeat;
    // Daily/weekly are capped at the end of the current year to avoid
    // runaway data. Yearly (including birthdays) has no end.
    let repeatUntil: string | null = null;
    if (effectiveRepeat === "daily" || effectiveRepeat === "weekly") {
      const yr = parseInt(date.slice(0, 4), 10) || new Date().getFullYear();
      repeatUntil = `${yr}-12-31`;
    }
    try {
      const evRef = await addDoc(
        collection(db, "organizations", orgId, "events"),
        {
          title: title.trim(),
          description: description.trim(),
          date: date.trim(),
          time: isBirthday ? "" : time.trim(),
          repeat: effectiveRepeat,
          repeatUntil,
          isBirthday,
          createdBy: userId,
          createdByName: userName,
          createdAt: serverTimestamp(),
        },
      );

      // Fire push notification to every other org member. Best-effort —
      // never blocks the UI, never throws.
      const when =
        date.trim() + (!isBirthday && time.trim() ? ` · ${time.trim()}` : "");
      const notifTitle = isBirthday
        ? t("notif_new_birthday_title", lang)
        : t("notif_new_event_title", lang);
      const actor = userName || t("notif_someone", lang);
      const body = `${actor}: ${title.trim()}${when ? ` — ${when}` : ""}`;
      notifyOrgOfNewEvent({
        orgId,
        creatorUid: userId,
        title: notifTitle,
        body,
        data: {
          type: isBirthday ? "new_birthday" : "new_event",
          orgId,
          eventId: evRef.id,
          screen: "calendar",
        },
      });

      setTitle("");
      setDescription("");
      setTime("");
      setIsBirthday(false);
      setRepeat("none");
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

            {/* Event type: Event | Birthday */}
            <View style={mStyles.field}>
              <Text style={mStyles.label}>{t("cal_type_label", lang)}</Text>
              <View style={mStyles.segmentRow}>
                <Pressable
                  onPress={() => {
                    setIsBirthday(false);
                    if (repeat === "yearly") setRepeat("none");
                  }}
                  style={[
                    mStyles.segment,
                    !isBirthday && mStyles.segmentActive,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={!isBirthday ? "#FFFFFF" : "#5B7553"}
                  />
                  <Text
                    style={[
                      mStyles.segmentText,
                      !isBirthday && mStyles.segmentTextActive,
                    ]}
                  >
                    {t("cal_type_event", lang)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIsBirthday(true);
                    setRepeat("yearly");
                    setTime("");
                  }}
                  style={[
                    mStyles.segment,
                    isBirthday && mStyles.segmentActive,
                  ]}
                >
                  <Ionicons
                    name="gift-outline"
                    size={16}
                    color={isBirthday ? "#FFFFFF" : "#5B7553"}
                  />
                  <Text
                    style={[
                      mStyles.segmentText,
                      isBirthday && mStyles.segmentTextActive,
                    ]}
                  >
                    {t("cal_type_birthday", lang)}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={mStyles.field}>
              <Text style={mStyles.label}>{t("tasks_title_label", lang)}</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={
                  isBirthday
                    ? t("cal_birthday_name", lang)
                    : t("cal_event_name", lang)
                }
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
              {!isBirthday && (
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
              )}
            </View>

            {/* Repeat rule — locked to Yearly for birthdays */}
            {!isBirthday && (
              <View style={mStyles.field}>
                <Text style={mStyles.label}>{t("cal_repeat_label", lang)}</Text>
                <View style={mStyles.repeatRow}>
                  {(
                    [
                      { k: "none", lbl: "cal_repeat_none" },
                      { k: "daily", lbl: "cal_repeat_daily" },
                      { k: "weekly", lbl: "cal_repeat_weekly" },
                      { k: "yearly", lbl: "cal_repeat_yearly" },
                    ] as const
                  ).map((opt) => (
                    <Pressable
                      key={opt.k}
                      onPress={() => setRepeat(opt.k)}
                      style={[
                        mStyles.repeatChip,
                        repeat === opt.k && mStyles.repeatChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          mStyles.repeatChipText,
                          repeat === opt.k && mStyles.repeatChipTextActive,
                        ]}
                      >
                        {t(opt.lbl, lang)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {(repeat === "daily" || repeat === "weekly") && (
                  <Text style={mStyles.hint}>
                    {t("cal_repeat_hint", lang)}
                  </Text>
                )}
              </View>
            )}
            {isBirthday && (
              <Text style={mStyles.hint}>
                {t("cal_birthday_hint", lang)}
              </Text>
            )}

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
  segmentRow: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    backgroundColor: "rgba(91,117,83,0.08)",
    borderRadius: 12,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: "#5B7553",
  },
  segmentText: {
    color: "#5B7553",
    fontSize: 14,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  repeatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  repeatChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  repeatChipActive: {
    backgroundColor: "#5B7553",
  },
  repeatChipText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "600",
  },
  repeatChipTextActive: {
    color: "#FFFFFF",
  },
  hint: {
    color: "#8A8F84",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
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
  calCard: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  dayHeaderRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    color: "#5B7553",
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 8,
  },
  dayHeaderWeekend: {
    color: "#C0956C",
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 10,
    gap: 3,
  },
  dayCellSelected: {
    backgroundColor: "#5B7553",
    borderRadius: 14,
  },
  dayCellToday: {
    backgroundColor: "rgba(141,91,45,0.1)",
    borderRadius: 14,
  },
  dayText: {
    color: "#2C3E2C",
    fontSize: 15,
    fontWeight: "500",
  },
  dayTextWeekend: {
    color: "#A3A89E",
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
  maybeBtnActive: {
    backgroundColor: "#C0956C",
  },
  attendBtnText: {
    color: "#5B7553",
    fontSize: 13,
    fontWeight: "600",
  },
  attendBtnTextActive: {
    color: "#FFFFFF",
  },
  maybeBtnTextActive: {
    color: "#FFFFFF",
  },
  eventDeleteBtn: {
    padding: 6,
    alignSelf: "flex-start",
  },
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(91,117,83,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(91,117,83,0.15)",
    padding: 14,
  },
  upcomingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#5B7553",
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingLabel: {
    color: "#5B7553",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  upcomingTitle: {
    color: "#2C3E2C",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 1,
  },
  upcomingMeta: {
    color: "#8A8F84",
    fontSize: 12,
    marginTop: 2,
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

// ===== Merged Calendar screen: segmented control that switches =====
// between the events calendar view and the tasks view.

type PlanTab = "events" | "tasks";

export default function CalendarScreen() {
  const { lang } = useLanguage();
  const [tab, setTab] = useState<PlanTab>("events");

  return (
    <View style={mergedStyles.root}>
      <View style={{ flex: 1 }}>
        {tab === "events" ? <CalendarEventsView /> : <TasksScreen />}
      </View>

      <View style={mergedStyles.segmentWrap}>
        <Pressable
          onPress={() => setTab("events")}
          style={[
            mergedStyles.segment,
            tab === "events" && mergedStyles.segmentActive,
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={tab === "events" ? "#FFFFFF" : "#5B7553"}
          />
          <Text
            style={[
              mergedStyles.segmentText,
              tab === "events" && mergedStyles.segmentTextActive,
            ]}
          >
            {t("tab_calendar", lang)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("tasks")}
          style={[
            mergedStyles.segment,
            tab === "tasks" && mergedStyles.segmentActive,
          ]}
        >
          <Ionicons
            name="checkbox-outline"
            size={16}
            color={tab === "tasks" ? "#FFFFFF" : "#5B7553"}
          />
          <Text
            style={[
              mergedStyles.segmentText,
              tab === "tasks" && mergedStyles.segmentTextActive,
            ]}
          >
            {t("tab_tasks", lang)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const mergedStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9F7F4",
  },
  segmentWrap: {
    flexDirection: "row",
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 4,
    backgroundColor: "rgba(91,117,83,0.08)",
    borderRadius: 14,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: "#5B7553",
    shadowColor: "#5B7553",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    color: "#5B7553",
    fontSize: 14,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
});
