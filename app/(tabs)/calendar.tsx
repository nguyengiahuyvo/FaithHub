import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";

type CalEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  createdByName: string | null;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const { org } = useOrg();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
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
            createdByName: d.data().createdByName || null,
          }))
        );
        setLoading(false);
      }
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

  if (!org) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Calendar</Text>
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
                        style={[
                          styles.dot,
                          isSelected && styles.dotSelected,
                        ]}
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
                <Text style={styles.emptyText}>No events</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {eventsForDate.map((ev) => (
                  <View key={ev.id} style={styles.eventCard}>
                    <View style={styles.eventTimeBadge}>
                      <Text style={styles.eventTime}>
                        {ev.time || "All day"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      {ev.description ? (
                        <Text style={styles.eventDesc}>{ev.description}</Text>
                      ) : null}
                      {ev.createdByName ? (
                        <Text style={styles.eventMeta}>
                          by {ev.createdByName}
                        </Text>
                      ) : null}
                    </View>
                  </View>
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
        onDismiss={() => setShowCreate(false)}
      />
    </View>
  );
}

function CreateEventModal({
  visible,
  orgId,
  userId,
  userName,
  defaultDate,
  onDismiss,
}: {
  visible: boolean;
  orgId: string;
  userId: string;
  userName: string | null;
  defaultDate: string;
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
      <Animated.View style={[mStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[mStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <Text style={mStyles.modalTitle}>New Event</Text>

          <View style={mStyles.field}>
            <Text style={mStyles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Event name"
              placeholderTextColor="#A3A89E"
              style={mStyles.input}
            />
          </View>

          <View style={mStyles.fieldRow}>
            <View style={[mStyles.field, { flex: 1 }]}>
              <Text style={mStyles.label}>Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#A3A89E"
                style={mStyles.input}
              />
            </View>
            <View style={[mStyles.field, { flex: 1 }]}>
              <Text style={mStyles.label}>Time</Text>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="e.g. 14:00"
                placeholderTextColor="#A3A89E"
                style={mStyles.input}
              />
            </View>
          </View>

          <View style={mStyles.field}>
            <Text style={mStyles.label}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add details..."
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
              <Text style={mStyles.cancelText}>Cancel</Text>
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
                <Text style={mStyles.createText}>Create</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

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
    flexDirection: "row",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 16,
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
    marginTop: 4,
  },
});
