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
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";

type Task = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "done";
  createdBy: string;
  createdByName: string | null;
};

export default function TasksScreen() {
  const { user } = useAuth();
  const { org } = useOrg();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!org) return;

    const unsub = onSnapshot(
      collection(db, "organizations", org.orgId, "tasks"),
      (snap) => {
        setTasks(
          snap.docs.map((d) => ({
            id: d.id,
            title: d.data().title,
            description: d.data().description || "",
            status: d.data().status || "todo",
            createdBy: d.data().createdBy,
            createdByName: d.data().createdByName || null,
          }))
        );
        setLoading(false);
      }
    );
    return unsub;
  }, [org]);

  async function toggleTask(taskId: string, currentStatus: string) {
    if (!org) return;
    const ref = doc(db, "organizations", org.orgId, "tasks", taskId);
    await updateDoc(ref, {
      status: currentStatus === "done" ? "todo" : "done",
    });
  }

  if (!org) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Tasks</Text>
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
        ) : tasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkbox-outline" size={40} color="#A3A89E" />
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to create your first task
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {tasks
              .sort((a, b) =>
                a.status === "done" && b.status !== "done" ? 1 : -1
              )
              .map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => toggleTask(task.id, task.status)}
                  style={[
                    styles.taskCard,
                    task.status === "done" && styles.taskCardDone,
                  ]}
                >
                  <Ionicons
                    name={
                      task.status === "done"
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={24}
                    color={task.status === "done" ? "#5B7553" : "#A3A89E"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.status === "done" && styles.taskTitleDone,
                      ]}
                    >
                      {task.title}
                    </Text>
                    {task.description ? (
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {task.description}
                      </Text>
                    ) : null}
                    {task.createdByName ? (
                      <Text style={styles.taskMeta}>
                        by {task.createdByName}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
          </View>
        )}
      </ScrollView>

      <CreateTaskModal
        visible={showCreate}
        orgId={org.orgId}
        userId={user?.uid ?? ""}
        userName={user?.displayName ?? null}
        onDismiss={() => setShowCreate(false)}
      />
    </View>
  );
}

function CreateTaskModal({
  visible,
  orgId,
  userId,
  userName,
  onDismiss,
}: {
  visible: boolean;
  orgId: string;
  userId: string;
  userName: string | null;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

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
      setTitle("");
      setDescription("");
      onDismiss();
    });
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "organizations", orgId, "tasks"), {
        title: title.trim(),
        description: description.trim(),
        status: "todo",
        createdBy: userId,
        createdByName: userName,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setDescription("");
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
          <Text style={mStyles.modalTitle}>New Task</Text>

          <View style={mStyles.field}>
            <Text style={mStyles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              placeholderTextColor="#A3A89E"
              style={mStyles.input}
            />
          </View>

          <View style={mStyles.field}>
            <Text style={mStyles.label}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add details..."
              placeholderTextColor="#A3A89E"
              style={[mStyles.input, { minHeight: 80, textAlignVertical: "top" }]}
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
    gap: 16,
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
  emptyCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 20,
    padding: 40,
    gap: 8,
    marginTop: 20,
  },
  emptyText: {
    color: "#2C3E2C",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#8A8F84",
    fontSize: 14,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 16,
  },
  taskCardDone: {
    opacity: 0.6,
  },
  taskTitle: {
    color: "#2C3E2C",
    fontSize: 16,
    fontWeight: "600",
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: "#8A8F84",
  },
  taskDesc: {
    color: "#6B7264",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  taskMeta: {
    color: "#A3A89E",
    fontSize: 12,
    marginTop: 4,
  },
});
