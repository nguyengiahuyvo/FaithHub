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
  deleteDoc,
  doc,
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
import CreateTaskModal, {
  type EditTask,
  type Priority,
  priorityLabel,
  priorityColor,
  priorityBg,
} from "@/components/CreateTaskModal";

type Comment = {
  id: string;
  text: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date | null;
};

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
  createdAt: Date | null;
};

export default function TasksScreen() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { lang } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<EditTask | null>(null);
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
            createdAt: d.data().createdAt?.toDate?.() || null,
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
              <TaskCard
                key={task.id}
                task={task}
                orgId={org.orgId}
                user={user}
                lang={lang}
                onToggle={toggleTask}
                onEdit={setEditingTask}
                onDelete={setDeleteTarget}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateTaskModal
        visible={showCreate || !!editingTask}
        orgId={org.orgId}
        userId={user?.uid ?? ""}
        userName={user?.displayName ?? null}
        lang={lang}
        editTask={editingTask}
        onDismiss={() => {
          setShowCreate(false);
          setEditingTask(null);
        }}
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

function formatDate(date: Date | null, lang: "en" | "de" | "vi"): string {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  if (lang === "de") return `${d}.${m}.${y}, ${h}:${min}`;
  if (lang === "vi") return `${d}/${m}/${y}, ${h}:${min}`;
  return `${m}/${d}/${y}, ${h}:${min}`;
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

function TaskCard({
  task,
  orgId,
  user,
  lang,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  orgId: string;
  user: { uid: string; displayName: string | null } | null;
  lang: "en" | "de" | "vi";
  onToggle: (taskId: string, currentStatus: string) => void;
  onEdit: (editTask: EditTask) => void;
  onDelete: (taskId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(null);

  // Always listen for comment count
  useEffect(() => {
    const commentsRef = collection(
      db,
      "organizations",
      orgId,
      "tasks",
      task.id,
      "comments",
    );
    const unsub = onSnapshot(commentsRef, (snap) => {
      setCommentCount(snap.size);
    });
    return unsub;
  }, [orgId, task.id]);

  // Load full comments when expanded
  useEffect(() => {
    if (!showComments) return;
    const q = query(
      collection(db, "organizations", orgId, "tasks", task.id, "comments"),
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
  }, [showComments, orgId, task.id]);

  async function handleDeleteComment() {
    if (!deleteCommentTarget) return;
    try {
      await deleteDoc(
        doc(
          db,
          "organizations",
          orgId,
          "tasks",
          task.id,
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
        collection(db, "organizations", orgId, "tasks", task.id, "comments"),
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

  return (
    <View
      style={[
        styles.taskCard,
        task.status === "done" && styles.taskCardDone,
      ]}
    >
      <Pressable
        onPress={() => onToggle(task.id, task.status)}
        style={styles.taskTopRow}
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
                <UserAvatar uid={task.assignedTo} name={task.assignedToName} size={14} />
                <Text style={styles.assigneeText}>
                  {task.assignedToName}
                </Text>
              </View>
            ) : null}
          </View>
          {task.createdByName ? (
            <View style={styles.creatorRow}>
              <UserAvatar uid={task.createdBy} name={task.createdByName} size={16} />
              <Text style={styles.taskMeta}>
                {t("tasks_by", lang)} {task.createdByName}
                {task.createdAt ? ` · ${formatDate(task.createdAt, lang)}` : ""}
              </Text>
            </View>
          ) : task.createdAt ? (
            <Text style={styles.taskMeta}>
              {t("tasks_created", lang)}: {formatDate(task.createdAt, lang)}
            </Text>
          ) : null}
        </View>
        {task.createdBy === user?.uid && (
          <View style={styles.actionCol}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEdit({
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  assignedTo: task.assignedTo,
                  assignedToName: task.assignedToName,
                });
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="pencil-outline" size={18} color="#5B7553" />
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </Pressable>
          </View>
        )}
      </Pressable>

      {/* Comments toggle button */}
      <Pressable
        onPress={() => setShowComments(!showComments)}
        style={[
          styles.commentToggleBtn,
          showComments && styles.commentToggleBtnActive,
        ]}
      >
        <Ionicons
          name="chatbubble-outline"
          size={14}
          color={showComments ? "#FFFFFF" : "#5B7553"}
        />
        <Text
          style={[
            styles.commentToggleText,
            showComments && styles.commentToggleTextActive,
          ]}
        >
          {t("tasks_comments", lang)}
          {commentCount > 0 ? ` (${commentCount})` : ""}
        </Text>
      </Pressable>

      {/* Delete comment confirm */}
      <DeleteConfirmModal
        visible={!!deleteCommentTarget}
        title={t("delete_title", lang)}
        message={t("tasks_delete_comment_msg", lang)}
        confirmText={t("delete", lang)}
        cancelText={t("cancel", lang)}
        onConfirm={handleDeleteComment}
        onDismiss={() => setDeleteCommentTarget(null)}
      />

      {/* Comments section */}
      {showComments && (
        <View style={commentStyles.container}>
          {comments.length === 0 ? (
            <Text style={commentStyles.empty}>
              {t("tasks_no_comments", lang)}
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
              placeholder={t("tasks_add_comment", lang)}
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
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 16,
  },
  taskTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
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
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  actionCol: {
    gap: 4,
    alignItems: "center",
  },
  actionBtn: {
    padding: 6,
  },
  commentToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(91,117,83,0.1)",
  },
  commentToggleBtnActive: {
    backgroundColor: "#5B7553",
  },
  commentToggleText: {
    color: "#5B7553",
    fontSize: 13,
    fontWeight: "600",
  },
  commentToggleTextActive: {
    color: "#FFFFFF",
  },
});

const commentStyles = StyleSheet.create({
  container: {
    marginTop: 2,
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
