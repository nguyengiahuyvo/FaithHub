import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Pressable } from "@/components/HapticPressable";
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
import { languageLabels, t, type Language } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import {
  POINTS_PER_QUESTION_CREATED,
  addToLeaderboard,
  type CommunityQuestion,
  type QuestionTranslation,
} from "@/lib/quest-questions";
import Snackbar, { useSnackbar } from "@/components/Snackbar";
import UserAvatar from "@/components/UserAvatar";

const C = {
  bg: "#F9F7F4",
  primary: "#5B7553",
  primaryDark: "#1F3B2E",
  accent: "#C0956C",
  text: "#1F2A1F",
  textMuted: "#5C625C",
  card: "#FFFFFF",
  border: "rgba(0,0,0,0.06)",
  correct: "#22C55E",
  wrong: "#DC2626",
};

const LANG_FLAGS: Record<Language, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  vi: "🇻🇳",
};

export default function QuestQuestionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { org } = useOrg();
  const { lang } = useLanguage();

  const [community, setCommunity] = useState<CommunityQuestion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CommunityQuestion | null>(null);
  const snack = useSnackbar();
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  snack.setMessage.current = setSnackMsg;

  // Live-subscribe to community questions in the org.
  useEffect(() => {
    if (!org) {
      setCommunity([]);
      return;
    }
    const qRef = query(
      collection(db, "organizations", org.orgId, "questQuestions"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(qRef, (snap) => {
      setCommunity(
        snap.docs
          .map((d) => {
            const data = d.data();
            const choices = Array.isArray(data.choices) ? data.choices : [];
            return {
              id: d.id,
              q: data.q || "",
              choices,
              answer: typeof data.answer === "number" ? data.answer : 0,
              ref: data.ref || undefined,
              successMsg: data.successMsg || undefined,
              failMsg: data.failMsg || undefined,
              language: (data.language as Language) || undefined,
              translations: data.translations || undefined,
              createdBy: data.createdBy || "",
              createdByName: data.createdByName || null,
            };
          })
          .filter(
            (c) =>
              c.q.trim().length > 0 &&
              c.choices.length === 4 &&
              c.choices.every(
                (x: unknown) =>
                  typeof x === "string" && x.trim().length > 0,
              ) &&
              c.answer >= 0 &&
              c.answer <= 3,
          ),
      );
    }, () => {});
    return unsub;
  }, [org]);

  const myQuestions = user
    ? community.filter((c) => c.createdBy === user.uid)
    : [];

  async function handleDelete(qid: string) {
    if (!org) return;
    try {
      await deleteDoc(
        doc(db, "organizations", org.orgId, "questQuestions", qid),
      );
    } catch {
      // ignore
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("qq_title", lang)}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {!org ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={28} color={C.primary} />
              <Text style={styles.emptyText}>{t("qq_need_org", lang)}</Text>
            </View>
          ) : (
            <>
              {/* Form: shown either when creating or editing. */}
              {showForm || editing ? (
                <NewQuestionForm
                  orgId={org.orgId}
                  userId={user?.uid}
                  userName={user?.displayName ?? null}
                  profileLang={lang}
                  editing={editing}
                  onClose={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  onSaved={(wasEdit) => {
                    setShowForm(false);
                    setEditing(null);
                    snack.show(
                      wasEdit
                        ? t("qq_updated_msg", lang)
                        : t("qq_created_msg", lang),
                    );
                  }}
                  lang={lang}
                />
              ) : (
                <Pressable
                  onPress={() => setShowForm(true)}
                  style={styles.addBtn}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>{t("qq_add", lang)}</Text>
                </Pressable>
              )}

              {/* My questions */}
              <Section
                title={t("qq_mine", lang)}
                count={myQuestions.length}
              >
                {myQuestions.length === 0 ? (
                  <Text style={styles.emptyHint}>
                    {t("qq_mine_empty", lang)}
                  </Text>
                ) : (
                  myQuestions.map((q) => (
                    <QuestionItem
                      key={q.id}
                      question={q}
                      ownedByMe
                      orgId={org.orgId}
                      userId={user?.uid}
                      onDelete={() => handleDelete(q.id)}
                      onEdit={() => {
                        setShowForm(false);
                        setEditing(q);
                      }}
                      lang={lang}
                    />
                  ))
                )}
              </Section>

            </>
          )}
        </ScrollView>
        <Snackbar message={snackMsg} opacity={snack.opacity} />
      </KeyboardAvoidingView>
    </>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{count}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

type QComment = {
  id: string;
  text: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date | null;
};

function QuestionItem({
  question,
  ownedByMe,
  orgId,
  userId,
  onDelete,
  onEdit,
  lang,
}: {
  question: CommunityQuestion;
  ownedByMe: boolean;
  orgId?: string;
  userId?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  lang: ReturnType<typeof useLanguage>["lang"];
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<QComment[]>([]);

  useEffect(() => {
    if (!orgId || !expanded) return;
    const q = query(
      collection(db, "organizations", orgId, "questQuestions", question.id, "comments"),
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
  }, [orgId, question.id, expanded]);

  async function handleDeleteComment(cid: string) {
    if (!orgId) return;
    try {
      await deleteDoc(
        doc(db, "organizations", orgId, "questQuestions", question.id, "comments", cid),
      );
    } catch {}
  }

  return (
    <Pressable
      onPress={() => setExpanded((x) => !x)}
      style={[styles.qItem, ownedByMe && styles.qItemMine]}
    >
      <View style={styles.qHeader}>
        <Text style={styles.qText} numberOfLines={expanded ? undefined : 2}>
          {question.q}
        </Text>
        {ownedByMe && onEdit && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            hitSlop={8}
            style={styles.qEdit}
          >
            <Ionicons name="create-outline" size={18} color={C.primary} />
          </Pressable>
        )}
        {ownedByMe && onDelete && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={8}
            style={styles.qDelete}
          >
            <Ionicons name="trash-outline" size={18} color={C.wrong} />
          </Pressable>
        )}
      </View>
      <View style={styles.qMeta}>
        {!ownedByMe && question.createdByName && (
          <View style={styles.qMetaPill}>
            <Ionicons name="person" size={10} color={C.accent} />
            <Text style={styles.qMetaPillText}>
              {question.createdByName}
            </Text>
          </View>
        )}
        {question.language && (
          <View
            style={[
              styles.qMetaPill,
              { backgroundColor: "rgba(91,117,83,0.10)" },
            ]}
          >
            <Ionicons name="language" size={10} color={C.primary} />
            <Text style={[styles.qMetaPillText, { color: C.primary }]}>
              {question.language.toUpperCase()}
            </Text>
          </View>
        )}
        {question.ref && (
          <View
            style={[
              styles.qMetaPill,
              { backgroundColor: "rgba(91,117,83,0.10)" },
            ]}
          >
            <Ionicons name="book-outline" size={10} color={C.primary} />
            <Text style={[styles.qMetaPillText, { color: C.primary }]}>
              {question.ref}
            </Text>
          </View>
        )}
      </View>

      {expanded && (
        <View style={styles.qExpand}>
          {question.choices.map((c, i) => {
            const isAnswer = i === question.answer;
            return (
              <View
                key={i}
                style={[
                  styles.qChoice,
                  isAnswer && styles.qChoiceCorrect,
                ]}
              >
                <Text
                  style={[
                    styles.qChoiceLetter,
                    isAnswer && { color: "#FFFFFF" },
                  ]}
                >
                  {String.fromCharCode(65 + i)}
                </Text>
                <Text
                  style={[
                    styles.qChoiceText,
                    isAnswer && { color: "#14532D", fontWeight: "700" },
                  ]}
                >
                  {c}
                </Text>
                {isAnswer && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={C.correct}
                  />
                )}
              </View>
            );
          })}
          {question.successMsg && (
            <Text style={styles.qMsg}>🎉 {question.successMsg}</Text>
          )}
          {question.failMsg && (
            <Text style={styles.qMsg}>😈 {question.failMsg}</Text>
          )}

          {/* Comments */}
          {ownedByMe && (
            <View style={styles.qComments}>
              <View style={styles.qCommentsHeader}>
                <Ionicons name="chatbubble-ellipses" size={14} color={C.primary} />
                <Text style={styles.qCommentsTitle}>
                  {t("quest_comments_title", lang)} ({comments.length})
                </Text>
              </View>
              {comments.length === 0 ? (
                <Text style={styles.qCommentsEmpty}>
                  {t("quest_comments_empty", lang)}
                </Text>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.qCommentRow}>
                    <UserAvatar uid={c.createdBy} name={c.createdByName} size={22} />
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={styles.qCommentName} numberOfLines={1}>
                        {c.createdByName || t("notif_someone", lang)}
                      </Text>
                      <Text style={styles.qCommentText}>{c.text}</Text>
                    </View>
                    {c.createdBy === userId && (
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); handleDeleteComment(c.id); }}
                        hitSlop={6}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="trash-outline" size={13} color={C.wrong} />
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ===== Inline form for creating a new question =====
function NewQuestionForm({
  orgId,
  userId,
  userName,
  profileLang,
  editing,
  onClose,
  onSaved,
  lang,
}: {
  orgId: string;
  userId: string | undefined;
  userName: string | null;
  profileLang: Language;
  editing: CommunityQuestion | null;
  onClose: () => void;
  onSaved: (wasEdit: boolean) => void;
  lang: ReturnType<typeof useLanguage>["lang"];
}) {
  const isEdit = editing !== null;

  // Build initial translations map from existing data
  function buildInitialTranslations(): Partial<Record<Language, QuestionTranslation>> {
    const map: Partial<Record<Language, QuestionTranslation>> = {};
    if (editing) {
      // Primary language content
      const primary = editing.language || profileLang;
      map[primary] = {
        q: editing.q,
        choices: [...editing.choices],
        successMsg: editing.successMsg,
        failMsg: editing.failMsg,
      };
      // Merge any saved translations
      if (editing.translations) {
        for (const [l, t] of Object.entries(editing.translations)) {
          if (t) map[l as Language] = { ...t };
        }
      }
    }
    return map;
  }

  const [translationsMap, setTranslationsMap] = useState(buildInitialTranslations);
  const [language, setLanguage] = useState<Language>(editing?.language ?? profileLang);
  const current = translationsMap[language];
  const [q, setQ] = useState(current?.q ?? "");
  const [choices, setChoices] = useState<string[]>(
    current?.choices ? [...current.choices] : ["", "", "", ""],
  );
  const [answer, setAnswer] = useState(editing?.answer ?? 0);
  const [ref, setRef] = useState(editing?.ref ?? "");
  const [successMsg, setSuccessMsg] = useState(current?.successMsg ?? "");
  const [failMsg, setFailMsg] = useState(current?.failMsg ?? "");
  const [saving, setSaving] = useState(false);

  function switchLanguage(next: Language) {
    // Save current form fields to translations map
    setTranslationsMap((prev) => ({
      ...prev,
      [language]: {
        q: q.trim() ? q : undefined,
        choices: choices.some((c) => c.trim()) ? choices : undefined,
        successMsg: successMsg.trim() || undefined,
        failMsg: failMsg.trim() || undefined,
      } as QuestionTranslation,
    }));
    // Load target language's fields
    const target = translationsMap[next];
    setQ(target?.q ?? "");
    setChoices(target?.choices ? [...target.choices] : ["", "", "", ""]);
    setSuccessMsg(target?.successMsg ?? "");
    setFailMsg(target?.failMsg ?? "");
    setLanguage(next);
  }

  // Slide-in animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const canSave =
    !!userId &&
    q.trim().length > 0 &&
    choices.every((c) => c.trim().length > 0);

  async function handleSave() {
    if (!canSave || !userId) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      // Merge current form fields into translations map
      const allTranslations: Record<string, QuestionTranslation> = {};
      const finalMap = {
        ...translationsMap,
        [language]: {
          q: q.trim(),
          choices: choices.map((c) => c.trim()),
          successMsg: successMsg.trim() || undefined,
          failMsg: failMsg.trim() || undefined,
        },
      };
      for (const [l, t] of Object.entries(finalMap)) {
        if (t && t.q && t.choices?.every((c: string) => c.trim())) {
          allTranslations[l] = t;
        }
      }
      // Use current language's content as primary fields
      const payload = {
        q: q.trim(),
        choices: choices.map((c) => c.trim()),
        answer,
        ref: ref.trim() || null,
        successMsg: successMsg.trim() || null,
        failMsg: failMsg.trim() || null,
        language,
        translations: allTranslations,
      };
      if (isEdit && editing) {
        // Editing — just update the existing doc; no points awarded.
        await updateDoc(
          doc(db, "organizations", orgId, "questQuestions", editing.id),
          { ...payload, updatedAt: serverTimestamp() },
        );
      } else {
        await addDoc(
          collection(db, "organizations", orgId, "questQuestions"),
          {
            ...payload,
            createdBy: userId,
            createdByName: userName,
            createdAt: serverTimestamp(),
          },
        );
        // Reward the author for contributing (only on fresh creation).
        await addToLeaderboard(
          orgId,
          userId,
          userName,
          POINTS_PER_QUESTION_CREATED,
        );
      }
      onSaved(isEdit);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <Animated.View
      style={[
        styles.formCard,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {isEdit ? t("qq_form_edit_title", lang) : t("qq_form_title", lang)}
        </Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={22} color={C.textMuted} />
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("qq_form_language", lang)}</Text>
        <View style={styles.langRow}>
          {(["en", "de", "vi"] as Language[]).map((l) => (
            <Pressable
              key={l}
              onPress={() => switchLanguage(l)}
              style={[
                styles.langChip,
                language === l && styles.langChipActive,
              ]}
            >
              <Text
                style={[
                  styles.langChipText,
                  language === l && styles.langChipTextActive,
                ]}
              >
                {LANG_FLAGS[l]}  {languageLabels[l]}
              </Text>
              {l !== language && translationsMap[l]?.q ? (
                <Ionicons name="checkmark-circle" size={14} color={C.correct} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("game_cq_question", lang)}</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t("game_cq_question_ph", lang)}
          placeholderTextColor="#A3A89E"
          style={[styles.input, { minHeight: 60 }]}
          multiline
        />
      </View>

      <Text style={styles.label}>{t("game_cq_choices", lang)}</Text>
      <Text style={styles.hint}>{t("game_cq_tap_correct", lang)}</Text>

      {choices.map((val, i) => {
        const isAnswer = i === answer;
        return (
          <View key={i} style={styles.choiceRow}>
            <Pressable
              onPress={() => setAnswer(i)}
              style={[
                styles.choiceBadge,
                isAnswer && styles.choiceBadgeActive,
              ]}
            >
              {isAnswer ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text style={styles.choiceBadgeText}>
                  {String.fromCharCode(65 + i)}
                </Text>
              )}
            </Pressable>
            <TextInput
              value={val}
              onChangeText={(txt) => {
                const next = [...choices];
                next[i] = txt;
                setChoices(next);
              }}
              placeholder={`${t("game_cq_choice_ph", lang)} ${String.fromCharCode(65 + i)}`}
              placeholderTextColor="#A3A89E"
              style={[styles.input, { flex: 1 }]}
            />
          </View>
        );
      })}

      <View style={styles.field}>
        <Text style={styles.label}>{t("game_cq_reference", lang)}</Text>
        <TextInput
          value={ref}
          onChangeText={setRef}
          placeholder={t("game_cq_reference_ph", lang)}
          placeholderTextColor="#A3A89E"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          🎉 {t("game_cq_success_label", lang)}
        </Text>
        <TextInput
          value={successMsg}
          onChangeText={setSuccessMsg}
          placeholder={t("game_cq_success_ph", lang)}
          placeholderTextColor="#A3A89E"
          style={[styles.input, { minHeight: 54 }]}
          multiline
          maxLength={140}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          😈 {t("game_cq_fail_label", lang)}
        </Text>
        <TextInput
          value={failMsg}
          onChangeText={setFailMsg}
          placeholder={t("game_cq_fail_ph", lang)}
          placeholderTextColor="#A3A89E"
          style={[styles.input, { minHeight: 54 }]}
          multiline
          maxLength={140}
        />
      </View>

      <View style={styles.formActions}>
        <Pressable onPress={onClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{t("cancel", lang)}</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={[
            styles.saveBtn,
            (!canSave || saving) && { opacity: 0.5 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>{t("game_cq_save", lang)}</Text>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.primaryDark,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },

  emptyCard: {
    alignItems: "center",
    gap: 8,
    padding: 24,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 32,
  },
  emptyText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyHint: {
    color: C.textMuted,
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 6,
  },

  // Add-button (collapsed state)
  addBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(91,117,83,0.10)",
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.primary,
  },

  // Question item
  qItem: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  qItemMine: {
    borderColor: "rgba(91,117,83,0.25)",
    backgroundColor: "#F8FBF6",
  },
  qHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  qText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    lineHeight: 20,
  },
  qDelete: { padding: 4 },
  qEdit: { padding: 4 },

  langRow: {
    flexDirection: "row",
    gap: 6,
  },
  myLangFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  myLangChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  myLangChipActive: {
    backgroundColor: C.primary,
  },
  myLangFlag: {
    fontSize: 14,
  },
  myLangChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
  },
  myLangChipTextActive: {
    color: "#FFFFFF",
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  langChipActive: {
    backgroundColor: C.primary,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
  },
  langChipTextActive: {
    color: "#FFFFFF",
  },
  qMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  qMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(192,149,108,0.15)",
  },
  qMetaPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.accent,
  },
  qExpand: {
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  qChoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F9F7F4",
  },
  qChoiceCorrect: {
    backgroundColor: "#DCFCE7",
  },
  qChoiceLetter: {
    width: 18,
    fontSize: 12,
    fontWeight: "800",
    color: C.textMuted,
  },
  qChoiceText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
  },
  qMsg: {
    fontSize: 12,
    color: C.textMuted,
    fontStyle: "italic",
    marginTop: 4,
  },
  qComments: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 6,
  },
  qCommentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qCommentsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.primaryDark,
  },
  qCommentsEmpty: {
    fontSize: 11,
    fontStyle: "italic",
    color: C.textMuted,
  },
  qCommentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F9F7F4",
    borderRadius: 8,
    padding: 6,
  },
  qCommentName: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMuted,
  },
  qCommentText: {
    fontSize: 12,
    color: C.text,
    lineHeight: 16,
  },

  // Form
  formCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.primaryDark,
  },
  field: { gap: 6, marginTop: 4 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primaryDark,
  },
  hint: {
    fontSize: 12,
    fontStyle: "italic",
    color: C.textMuted,
  },
  input: {
    backgroundColor: "#F9F7F4",
    borderColor: "rgba(0,0,0,0.08)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  choiceBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  choiceBadgeActive: {
    backgroundColor: C.correct,
  },
  choiceBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textMuted,
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
  },
  cancelText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  saveBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
