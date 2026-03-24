import { Ionicons } from "@expo/vector-icons";
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
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { t, type Language } from "@/lib/i18n";
import UserAvatar from "@/components/UserAvatar";

const PRIORITIES = [1, 2, 3, 4] as const;
export type Priority = (typeof PRIORITIES)[number];

export type Assignee = {
  uid: string;
  displayName: string | null;
} | null;

type Member = {
  uid: string;
  displayName: string | null;
  email: string;
};

export type EditTask = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignedTo: string | null;
  assignedToName: string | null;
};

export function priorityLabel(p: Priority, lang: Language): string {
  const map: Record<Priority, Parameters<typeof t>[0]> = {
    1: "tasks_priority_low",
    2: "tasks_priority_medium",
    3: "tasks_priority_high",
    4: "tasks_priority_urgent",
  };
  return t(map[p], lang);
}

export function priorityColor(p: Priority): string {
  const map: Record<Priority, string> = {
    1: "#6B7264",
    2: "#D97706",
    3: "#EA580C",
    4: "#DC2626",
  };
  return map[p];
}

export function priorityBg(p: Priority): string {
  const map: Record<Priority, string> = {
    1: "rgba(107,114,100,0.10)",
    2: "rgba(217,119,6,0.10)",
    3: "rgba(234,88,12,0.10)",
    4: "rgba(220,38,38,0.10)",
  };
  return map[p];
}

export default function CreateTaskModal({
  visible,
  orgId,
  userId,
  userName,
  lang,
  onDismiss,
  editTask,
}: {
  visible: boolean;
  orgId: string;
  userId: string;
  userName: string | null;
  lang: Language;
  onDismiss: () => void;
  editTask?: EditTask | null;
}) {
  const isEdit = !!editTask;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(2);
  const [assignee, setAssignee] = useState<Assignee>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoadingMembers(true);
    getDocs(collection(db, "organizations", orgId, "members"))
      .then((snap) => {
        setMembers(
          snap.docs.map((d) => ({
            uid: d.id,
            displayName: d.data().displayName || null,
            email: d.data().email || "",
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  }, [visible, orgId]);

  useEffect(() => {
    if (visible && editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setPriority(editTask.priority);
      setAssignee(
        editTask.assignedTo
          ? { uid: editTask.assignedTo, displayName: editTask.assignedToName }
          : null,
      );
    }
  }, [visible, editTask]);

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
      setPriority(2);
      setAssignee(null);
      setShowDropdown(false);
      onDismiss();
    });
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEdit && editTask) {
        await updateDoc(
          doc(db, "organizations", orgId, "tasks", editTask.id),
          {
            title: title.trim(),
            description: description.trim(),
            priority,
            assignedTo: assignee?.uid || null,
            assignedToName: assignee?.displayName || null,
          },
        );
      } else {
        await addDoc(collection(db, "organizations", orgId, "tasks"), {
          title: title.trim(),
          description: description.trim(),
          status: "todo",
          priority,
          assignedTo: assignee?.uid || null,
          assignedToName: assignee?.displayName || null,
          createdBy: userId,
          createdByName: userName,
          createdAt: serverTimestamp(),
        });
      }
      setTitle("");
      setDescription("");
      setPriority(2);
      setAssignee(null);
      setShowDropdown(false);
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
            <Text style={mStyles.modalTitle}>
              {isEdit ? t("tasks_edit", lang) : t("tasks_new", lang)}
            </Text>

            <View style={mStyles.field}>
              <Text style={mStyles.label}>{t("tasks_title_label", lang)}</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("tasks_title_placeholder", lang)}
                placeholderTextColor="#A3A89E"
                style={mStyles.input}
              />
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
                  { minHeight: 80, textAlignVertical: "top" },
                ]}
                multiline
              />
            </View>

            <View style={mStyles.field}>
              <Text style={mStyles.label}>{t("tasks_priority", lang)}</Text>
              <View style={mStyles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const selected = p === priority;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[
                        mStyles.priorityChip,
                        {
                          backgroundColor: selected
                            ? priorityColor(p)
                            : priorityBg(p),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          mStyles.priorityChipText,
                          {
                            color: selected ? "#FFFFFF" : priorityColor(p),
                          },
                        ]}
                      >
                        {priorityLabel(p, lang)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Assign to */}
            <View style={mStyles.field}>
              <Text style={mStyles.label}>{t("tasks_assign_to", lang)}</Text>
              <Pressable
                onPress={() => setShowDropdown(!showDropdown)}
                style={mStyles.dropdownBtn}
              >
                <Text
                  style={[
                    mStyles.dropdownBtnText,
                    !assignee && { color: "#A3A89E" },
                  ]}
                >
                  {assignee
                    ? assignee.displayName || t("tasks_unassigned", lang)
                    : t("tasks_select_member", lang)}
                </Text>
                <Ionicons
                  name={showDropdown ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#8A8F84"
                />
              </Pressable>
              {showDropdown && (
                <View style={mStyles.dropdown}>
                  {loadingMembers ? (
                    <ActivityIndicator
                      color="#5B7553"
                      size="small"
                      style={{ paddingVertical: 12 }}
                    />
                  ) : (
                    <ScrollView
                      style={{ maxHeight: 160 }}
                      nestedScrollEnabled
                    >
                      {/* Unassigned option */}
                      <Pressable
                        onPress={() => {
                          setAssignee(null);
                          setShowDropdown(false);
                        }}
                        style={[
                          mStyles.dropdownItem,
                          !assignee && mStyles.dropdownItemSelected,
                        ]}
                      >
                        <Text
                          style={[
                            mStyles.dropdownItemText,
                            !assignee && mStyles.dropdownItemTextSelected,
                          ]}
                        >
                          {t("tasks_unassigned", lang)}
                        </Text>
                      </Pressable>
                      {members.map((m) => {
                        const selected = assignee?.uid === m.uid;
                        return (
                          <Pressable
                            key={m.uid}
                            onPress={() => {
                              setAssignee({
                                uid: m.uid,
                                displayName: m.displayName,
                              });
                              setShowDropdown(false);
                            }}
                            style={[
                              mStyles.dropdownItem,
                              selected && mStyles.dropdownItemSelected,
                            ]}
                          >
                            <UserAvatar uid={m.uid} name={m.displayName} email={m.email} size={28} />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  mStyles.dropdownItemText,
                                  selected &&
                                    mStyles.dropdownItemTextSelected,
                                ]}
                                numberOfLines={1}
                              >
                                {m.displayName || m.email}
                              </Text>
                              {m.displayName && m.email ? (
                                <Text
                                  style={mStyles.dropdownItemSub}
                                  numberOfLines={1}
                                >
                                  {m.email}
                                </Text>
                              ) : null}
                            </View>
                            {selected && (
                              <Ionicons
                                name="checkmark"
                                size={18}
                                color="#5B7553"
                              />
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            <View style={mStyles.buttonRow}>
              <Pressable onPress={handleDismiss} style={mStyles.cancelBtn}>
                <Text style={mStyles.cancelText}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving || !title.trim()}
                style={[
                  mStyles.createBtn,
                  (saving || !title.trim()) && { opacity: 0.6 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={mStyles.createText}>
                    {isEdit ? t("save", lang) : t("create", lang)}
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>
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
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F7F4",
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownBtnText: {
    color: "#111827",
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(91,117,83,0.08)",
  },
  dropdownItemText: {
    color: "#2C3E2C",
    fontSize: 15,
  },
  dropdownItemTextSelected: {
    color: "#5B7553",
    fontWeight: "600",
  },
  dropdownItemSub: {
    color: "#A3A89E",
    fontSize: 12,
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
