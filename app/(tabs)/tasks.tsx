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
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import CreateTaskModal, {
  type Priority,
  priorityLabel,
  priorityColor,
  priorityBg,
} from "@/components/CreateTaskModal";

type Task = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "done";
  priority: Priority;
  assignedTo: string | null;
  assignedToName: string | null;
  createdBy: string;
  createdByName: string | null;
};

export default function TasksScreen() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { lang } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
            priority: (d.data().priority as Priority) || 2,
            assignedTo: d.data().assignedTo || null,
            assignedToName: d.data().assignedToName || null,
            createdBy: d.data().createdBy,
            createdByName: d.data().createdByName || null,
          })),
        );
        setLoading(false);
      },
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

  async function handleDeleteTask() {
    if (!org || !deleteTarget) return;
    await deleteDoc(
      doc(db, "organizations", org.orgId, "tasks", deleteTarget),
    );
    setDeleteTarget(null);
  }

  const sorted = [...tasks].sort((a, b) => {
    // Done tasks go to bottom
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    // Higher priority first (4 = urgent on top)
    return b.priority - a.priority;
  });

  if (!org) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("tasks_title", lang)}</Text>
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
            <Text style={styles.emptyText}>{t("tasks_empty", lang)}</Text>
            <Text style={styles.emptySubtext}>
              {t("tasks_empty_hint", lang)}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {sorted.map((task) => (
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
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: priorityBg(task.priority) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBadgeText,
                          { color: priorityColor(task.priority) },
                        ]}
                      >
                        {priorityLabel(task.priority, lang)}
                      </Text>
                    </View>
                    {task.assignedToName ? (
                      <View style={styles.assigneeBadge}>
                        <Ionicons name="person-outline" size={11} color="#5B7553" />
                        <Text style={styles.assigneeText}>
                          {task.assignedToName}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {task.createdByName ? (
                    <Text style={styles.taskMeta}>
                      {t("tasks_by", lang)} {task.createdByName}
                    </Text>
                  ) : null}
                </View>
                {task.createdBy === user?.uid && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(task.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#DC2626"
                    />
                  </Pressable>
                )}
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
        lang={lang}
        onDismiss={() => setShowCreate(false)}
      />

      <DeleteConfirmModal
        visible={!!deleteTarget}
        title={t("delete_title", lang)}
        message={t("delete_task_msg", lang)}
        confirmText={t("delete", lang)}
        cancelText={t("cancel", lang)}
        onConfirm={handleDeleteTask}
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
      <Animated.View style={[dStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[dStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View style={dStyles.iconCircle}>
            <Ionicons name="trash-outline" size={28} color="#DC2626" />
          </View>
          <Text style={dStyles.title}>{title}</Text>
          <Text style={dStyles.message}>{message}</Text>
          <View style={dStyles.buttonRow}>
            <Pressable onPress={handleDismiss} style={dStyles.cancelBtn}>
              <Text style={dStyles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={dStyles.deleteBtn}>
              <Text style={dStyles.deleteBtnText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const dStyles = StyleSheet.create({
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: "700",
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
  assigneeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(91,117,83,0.10)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  assigneeText: {
    color: "#5B7553",
    fontSize: 11,
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 6,
  },
});
