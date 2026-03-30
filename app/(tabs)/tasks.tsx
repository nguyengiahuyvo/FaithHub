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
import {
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import CreateTaskModal, {
  type Assignee,
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

type VoteOption = {
  label: string;
  voters: { uid: string; displayName: string | null }[];
};

type Vote = {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  deadline: string; // YYYY-MM-DD
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
  assignees: Assignee[];
  helpers: Assignee[];
  createdBy: string;
  createdByName: string | null;
  createdAt: Date | null;
};

export default function TasksScreen() {
  const { user } = useAuth();
  const { org } = useOrg();
  const { lang } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [showChoiceMenu, setShowChoiceMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateVote, setShowCreateVote] = useState(false);
  const [editingTask, setEditingTask] = useState<EditTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteVoteTarget, setDeleteVoteTarget] = useState<string | null>(null);

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
            assignees: d.data().assignees ||
              (d.data().assignedTo
                ? [{ uid: d.data().assignedTo, displayName: d.data().assignedToName || null }]
                : []),
            helpers: d.data().helpers || [],
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

  // Votes listener
  useEffect(() => {
    if (!org) return;
    const q = query(
      collection(db, "organizations", org.orgId, "votes"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setVotes(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title || "",
          description: d.data().description || "",
          options: d.data().options || [],
          deadline: d.data().deadline || "",
          createdBy: d.data().createdBy || "",
          createdByName: d.data().createdByName || null,
          createdAt: d.data().createdAt?.toDate?.() || null,
        })),
      );
      setLoadingVotes(false);
    });
    return unsub;
  }, [org]);

  async function toggleTask(taskId: string, currentStatus: string) {
    if (!org) return;
    const ref = doc(db, "organizations", org.orgId, "tasks", taskId);
    await updateDoc(ref, {
      status: currentStatus === "done" ? "todo" : "done",
    });
  }

  async function toggleHelper(taskId: string, helpers: Assignee[]) {
    if (!org || !user) return;
    const ref = doc(db, "organizations", org.orgId, "tasks", taskId);
    const me: Assignee = { uid: user.uid, displayName: user.displayName };
    const existing = helpers.find((h) => h.uid === user.uid);
    if (existing) {
      await updateDoc(ref, { helpers: arrayRemove(existing) });
    } else {
      await updateDoc(ref, { helpers: arrayUnion(me) });
    }
  }

  async function handleDeleteTask() {
    if (!org || !deleteTarget) return;
    await deleteDoc(
      doc(db, "organizations", org.orgId, "tasks", deleteTarget),
    );
    setDeleteTarget(null);
  }

  async function handleDeleteVote() {
    if (!org || !deleteVoteTarget) return;
    await deleteDoc(
      doc(db, "organizations", org.orgId, "votes", deleteVoteTarget),
    );
    setDeleteVoteTarget(null);
  }

  async function handleVote(voteId: string, optionIndex: number) {
    if (!org || !user) return;
    const voteDoc = votes.find((v) => v.id === voteId);
    if (!voteDoc) return;
    const ref = doc(db, "organizations", org.orgId, "votes", voteId);
    const me = { uid: user.uid, displayName: user.displayName };

    // Build updated options: remove user from all options, then add to selected
    const updatedOptions = voteDoc.options.map((opt, i) => {
      const filtered = opt.voters.filter((v) => v.uid !== user.uid);
      if (i === optionIndex) {
        // Toggle: if already voted for this option, just remove
        const wasVoted = opt.voters.some((v) => v.uid === user.uid);
        return { ...opt, voters: wasVoted ? filtered : [...filtered, me] };
      }
      return { ...opt, voters: filtered };
    });
    await updateDoc(ref, { options: updatedOptions });
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("tasks_title", lang)}</Text>
          <Pressable
            onPress={() => setShowChoiceMenu(true)}
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
                onToggleHelper={toggleHelper}
                onEdit={setEditingTask}
                onDelete={setDeleteTarget}
              />
            ))}
          </View>
        )}

        {/* Votes */}
        {!loading && votes.length > 0 && (
          <View style={{ gap: 10, marginTop: 8 }}>
            {votes.map((vote) => {
              const totalVotes = vote.options.reduce((sum, o) => sum + o.voters.length, 0);
              const todayStr = new Date().toISOString().split("T")[0];
              const isEnded = vote.deadline && vote.deadline < todayStr;
              return (
                <View key={vote.id} style={styles.voteCard}>
                  <View style={styles.voteHeader}>
                    <Ionicons name="podium-outline" size={18} color="#5B7553" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.voteTitle}>{vote.title}</Text>
                      {vote.description ? (
                        <Text style={styles.voteDesc}>{vote.description}</Text>
                      ) : null}
                    </View>
                    {vote.createdBy === user?.uid && (
                      <Pressable onPress={() => setDeleteVoteTarget(vote.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      </Pressable>
                    )}
                  </View>

                  {/* Options */}
                  <View style={{ gap: 6 }}>
                    {vote.options.map((opt, i) => {
                      const count = opt.voters.length;
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      const myVote = opt.voters.some((v) => v.uid === user?.uid);
                      return (
                        <Pressable
                          key={i}
                          onPress={() => !isEnded && handleVote(vote.id, i)}
                          style={[styles.voteOption, myVote && styles.voteOptionSelected]}
                        >
                          <View style={[styles.voteBar, { width: `${pct}%` }]} />
                          <Text style={[styles.voteOptionText, myVote && styles.voteOptionTextSelected]}>
                            {opt.label}
                          </Text>
                          <Text style={styles.votePct}>
                            {count} {count === 1 ? t("vote_vote", lang) : t("vote_votes", lang)} ({pct}%)
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Footer */}
                  <View style={styles.voteFooter}>
                    {vote.createdByName && (
                      <Text style={styles.voteMeta}>
                        {t("tasks_by", lang)} {vote.createdByName}
                      </Text>
                    )}
                    {vote.deadline ? (
                      <Text style={[styles.voteMeta, isEnded && { color: "#DC2626" }]}>
                        {isEnded ? t("vote_ended", lang) : t("vote_ends", lang)}: {vote.deadline}
                      </Text>
                    ) : null}
                    <Text style={styles.voteMeta}>
                      {totalVotes} {totalVotes === 1 ? t("vote_vote", lang) : t("vote_votes", lang)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Choice menu: Task or Vote */}
      {showChoiceMenu && (
        <Modal transparent visible animationType="none">
          <Pressable
            style={styles.choiceBackdrop}
            onPress={() => setShowChoiceMenu(false)}
          >
            <View style={styles.choiceMenu}>
              <Pressable
                onPress={() => {
                  setShowChoiceMenu(false);
                  setShowCreate(true);
                }}
                style={styles.choiceItem}
              >
                <Ionicons name="checkbox-outline" size={22} color="#5B7553" />
                <Text style={styles.choiceText}>{t("tasks_add_task", lang)}</Text>
              </Pressable>
              <View style={styles.choiceDivider} />
              <Pressable
                onPress={() => {
                  setShowChoiceMenu(false);
                  setShowCreateVote(true);
                }}
                style={styles.choiceItem}
              >
                <Ionicons name="podium-outline" size={22} color="#5B7553" />
                <Text style={styles.choiceText}>{t("tasks_add_vote", lang)}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}

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

      <CreateVoteModal
        visible={showCreateVote}
        orgId={org.orgId}
        userId={user?.uid ?? ""}
        userName={user?.displayName ?? null}
        lang={lang}
        onDismiss={() => setShowCreateVote(false)}
      />

      <DeleteConfirmModal
        visible={!!deleteVoteTarget}
        title={t("delete_title", lang)}
        message={t("delete_vote_msg", lang)}
        confirmText={t("delete", lang)}
        cancelText={t("cancel", lang)}
        onConfirm={handleDeleteVote}
        onDismiss={() => setDeleteVoteTarget(null)}
      />
    </View>
  );
}

function CreateVoteModal({
  visible,
  orgId,
  userId,
  userName,
  lang,
  onDismiss,
}: {
  visible: boolean;
  orgId: string;
  userId: string;
  userName: string | null;
  lang: "en" | "de" | "vi";
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [deadline, setDeadline] = useState("");
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
      setOptions(["", ""]);
      setDeadline("");
      onDismiss();
    });
  }

  async function handleCreate() {
    const validOptions = options.filter((o) => o.trim());
    if (!title.trim() || validOptions.length < 2) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "organizations", orgId, "votes"), {
        title: title.trim(),
        description: description.trim(),
        options: validOptions.map((label) => ({ label: label.trim(), voters: [] })),
        deadline: deadline.trim(),
        createdBy: userId,
        createdByName: userName,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setDescription("");
      setOptions(["", ""]);
      setDeadline("");
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
      <Animated.View style={[voteModalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[voteModalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <Text style={voteModalStyles.modalTitle}>{t("tasks_add_vote", lang)}</Text>

          <View style={voteModalStyles.field}>
            <Text style={voteModalStyles.label}>{t("vote_title_label", lang)}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t("vote_title_placeholder", lang)}
              placeholderTextColor="#A3A89E"
              style={voteModalStyles.input}
            />
          </View>

          <View style={voteModalStyles.field}>
            <Text style={voteModalStyles.label}>{t("tasks_desc_label", lang)}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t("tasks_desc_placeholder", lang)}
              placeholderTextColor="#A3A89E"
              style={[voteModalStyles.input, { minHeight: 60, textAlignVertical: "top" }]}
              multiline
            />
          </View>

          <View style={voteModalStyles.field}>
            <Text style={voteModalStyles.label}>{t("vote_option", lang)}</Text>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
              {options.map((opt, i) => (
                <View key={i} style={voteModalStyles.optionRow}>
                  <TextInput
                    value={opt}
                    onChangeText={(val) => {
                      const updated = [...options];
                      updated[i] = val;
                      setOptions(updated);
                    }}
                    placeholder={`${t("vote_option", lang)} ${i + 1}`}
                    placeholderTextColor="#A3A89E"
                    style={[voteModalStyles.input, { flex: 1 }]}
                  />
                  {options.length > 2 && (
                    <Pressable
                      onPress={() => setOptions(options.filter((_, j) => j !== i))}
                      style={voteModalStyles.removeBtn}
                    >
                      <Ionicons name="close-circle" size={22} color="#DC2626" />
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setOptions([...options, ""])}
              style={voteModalStyles.addOptionBtn}
            >
              <Ionicons name="add-circle-outline" size={18} color="#5B7553" />
              <Text style={voteModalStyles.addOptionText}>{t("vote_add_option", lang)}</Text>
            </Pressable>
          </View>

          <View style={voteModalStyles.field}>
            <Text style={voteModalStyles.label}>{t("vote_deadline", lang)}</Text>
            <TextInput
              value={deadline}
              onChangeText={setDeadline}
              placeholder={t("vote_deadline_placeholder", lang)}
              placeholderTextColor="#A3A89E"
              style={voteModalStyles.input}
            />
          </View>

          <View style={voteModalStyles.buttonRow}>
            <Pressable onPress={handleDismiss} style={voteModalStyles.cancelBtn}>
              <Text style={voteModalStyles.cancelText}>{t("cancel", lang)}</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              disabled={saving || !title.trim() || options.filter((o) => o.trim()).length < 2}
              style={[
                voteModalStyles.createBtn,
                (saving || !title.trim() || options.filter((o) => o.trim()).length < 2) && { opacity: 0.6 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={voteModalStyles.createText}>{t("create", lang)}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const voteModalStyles = StyleSheet.create({
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  removeBtn: {
    padding: 2,
  },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  addOptionText: {
    color: "#5B7553",
    fontSize: 14,
    fontWeight: "600",
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
  onToggleHelper,
  onEdit,
  onDelete,
}: {
  task: Task;
  orgId: string;
  user: { uid: string; displayName: string | null } | null;
  lang: "en" | "de" | "vi";
  onToggle: (taskId: string, currentStatus: string) => void;
  onToggleHelper: (taskId: string, helpers: Assignee[]) => void;
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
            {task.assignees.map((a) => (
              <View key={a.uid} style={styles.assigneeBadge}>
                <UserAvatar uid={a.uid} name={a.displayName} size={14} />
                <Text style={styles.assigneeText}>
                  {a.displayName || "?"}
                </Text>
              </View>
            ))}
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
                  assignees: task.assignees,
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

      {/* Helpers row */}
      {task.helpers.length > 0 && (
        <View style={styles.helpersRow}>
          {task.helpers.map((h) => (
            <View key={h.uid} style={styles.assigneeBadge}>
              <UserAvatar uid={h.uid} name={h.displayName} size={14} />
              <Text style={styles.helperText}>{h.displayName || "?"}</Text>
            </View>
          ))}
          <Text style={styles.helperCount}>
            {task.helpers.length}{" "}
            {task.helpers.length === 1 ? t("tasks_helper", lang) : t("tasks_helpers", lang)}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {(() => {
          const isHelping = task.helpers.some((h) => h.uid === user?.uid);
          return (
            <Pressable
              onPress={() => onToggleHelper(task.id, task.helpers)}
              style={[
                styles.commentToggleBtn,
                isHelping && styles.helpBtnActive,
              ]}
            >
              <Ionicons
                name={isHelping ? "heart" : "heart-outline"}
                size={14}
                color={isHelping ? "#FFFFFF" : "#C0956C"}
              />
              <Text
                style={[
                  styles.commentToggleText,
                  { color: "#C0956C" },
                  isHelping && styles.helpBtnTextActive,
                ]}
              >
                {isHelping ? t("tasks_helping", lang) : t("tasks_offer_help", lang)}
              </Text>
            </Pressable>
          );
        })()}

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
      </View>

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
    flexWrap: "wrap",
    gap: 6,
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
  helpBtnActive: {
    backgroundColor: "#C0956C",
  },
  helpBtnTextActive: {
    color: "#FFFFFF",
  },
  helpersRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  helperText: {
    color: "#C0956C",
    fontSize: 11,
    fontWeight: "600",
  },
  helperCount: {
    color: "#A3A89E",
    fontSize: 11,
    marginLeft: 2,
  },
  // Choice menu
  choiceBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  choiceMenu: {
    width: "100%",
    maxWidth: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  choiceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  choiceText: {
    color: "#2C3E2C",
    fontSize: 17,
    fontWeight: "600",
  },
  choiceDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 16,
  },
  // Vote card
  voteCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(91,117,83,0.15)",
    padding: 16,
    gap: 12,
  },
  voteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  voteTitle: {
    color: "#2C3E2C",
    fontSize: 16,
    fontWeight: "600",
  },
  voteDesc: {
    color: "#6B7264",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  voteOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: "hidden",
    position: "relative",
  },
  voteOptionSelected: {
    backgroundColor: "rgba(91,117,83,0.12)",
    borderWidth: 1,
    borderColor: "#5B7553",
  },
  voteBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(91,117,83,0.08)",
    borderRadius: 12,
  },
  voteOptionText: {
    color: "#2C3E2C",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    zIndex: 1,
  },
  voteOptionTextSelected: {
    color: "#5B7553",
    fontWeight: "700",
  },
  votePct: {
    color: "#8A8F84",
    fontSize: 12,
    fontWeight: "600",
    zIndex: 1,
  },
  voteFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  voteMeta: {
    color: "#A3A89E",
    fontSize: 12,
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
