import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Modal,
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
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import { t, type Language } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import UserAvatar from "@/components/UserAvatar";
import Snackbar, { useSnackbar } from "@/components/Snackbar";
import { notifyMentionedUsers } from "@/lib/notifications";
import {
  addToLeaderboard,
  availableLanguages,
  resolveTranslation,
  type CommunityQuestion,
  type Question,
} from "@/lib/quest-questions";

// ===== Game constants =====
const QUESTIONS_PER_ROUND = 10;
const TIME_PER_QUESTION_MS = 15000;
// Scoring — all balances are in Shekel, the in-game currency:
//   +5 Shekel per correct answer
//   +2 Shekel per question authored
//   -10 Shekel cost to start a round
const POINTS_PER_CORRECT = 5;
const POINTS_PER_QUESTION_CREATED = 2;
const PLAY_COST_SHEKEL = 10;
const STARTING_HEARTS = 3;

// Flag emojis used for the language chips.
const LANG_FLAGS: Record<Language, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  vi: "🇻🇳",
};
// Play limits: max 5 rounds/day; 30-minute cooldown if you lose all hearts.
const MAX_ROUNDS_PER_DAY = 10;
const COOLDOWN_AFTER_FAIL_MS = 30 * 60 * 1000;
const ONBOARDING_KEY = "@faithhub/verseQuest/onboardingSeen";
const DAILY_PLAYS_KEY = "@faithhub/verseQuest/dailyPlays";
const COOLDOWN_KEY = "@faithhub/verseQuest/cooldownUntil";
// Local fallback score (used only when the player isn't in an organization).
const LOCAL_SCORE_KEY = "@faithhub/verseQuest/localScore";

// ===== Play-limit & cooldown helpers (AsyncStorage) =====
type DailyPlays = { date: string; count: number };

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readPlaysToday(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_PLAYS_KEY);
    if (!raw) return 0;
    const parsed: DailyPlays = JSON.parse(raw);
    return parsed.date === todayStr() ? parsed.count : 0;
  } catch {
    return 0;
  }
}

async function bumpPlaysToday(): Promise<number> {
  const today = todayStr();
  const current = await readPlaysToday();
  const next = current + 1;
  try {
    await AsyncStorage.setItem(
      DAILY_PLAYS_KEY,
      JSON.stringify({ date: today, count: next }),
    );
  } catch {}
  return next;
}

async function readCooldownUntil(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(COOLDOWN_KEY);
    if (!raw) return null;
    const ts = parseInt(raw, 10);
    if (!Number.isFinite(ts) || ts <= Date.now()) return null;
    return ts;
  } catch {
    return null;
  }
}

async function writeCooldownUntil(ts: number): Promise<void> {
  try {
    await AsyncStorage.setItem(COOLDOWN_KEY, String(ts));
  } catch {}
}

// "29:42" / "00:08" — minutes:seconds remaining.
function formatCooldown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ===== Colors =====
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
  correctSoft: "#DCFCE7",
  wrong: "#DC2626",
  wrongSoft: "#FEE2E2",
  heart: "#E11D48",
  gold: "#D97706",
  neutral: "#E5E7EB",
};

// ===== Local helper types =====
type LeaderboardEntry = {
  uid: string;
  displayName: string | null;
  score: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Per the rules: a round only uses questions written by other community
// members. Built-in questions are not part of the pool. Round size is
// capped at QUESTIONS_PER_ROUND but shrinks if the pool is small.
function buildRound(community: CommunityQuestion[]): Question[] {
  return shuffle(community).slice(0, QUESTIONS_PER_ROUND);
}

type Mode = "idle" | "playing" | "done";

export default function GameScreen() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { org } = useOrg();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("idle");
  const [round, setRound] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hearts, setHearts] = useState(STARTING_HEARTS);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [community, setCommunity] = useState<CommunityQuestion[]>([]);
  // Confirmation dialogs
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  // Snackbar (for the "−10 Shekel paid" notification after override)
  const snack = useSnackbar();
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  snack.setMessage.current = setSnackMsg;
  // Language filter for the round — defaults to the player's profile lang.
  const [playLang, setPlayLang] = useState<Language>(lang);
  // Keep playLang in sync if the user changes their profile language.
  useEffect(() => {
    setPlayLang(lang);
  }, [lang]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playsToday, setPlaysToday] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [roundFailed, setRoundFailed] = useState(false);

  useEffect(() => {
    // First-time visitors see the how-to-play onboarding automatically.
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => {
        if (!v) setShowOnboarding(true);
      })
      .catch(() => {});
    // Hydrate play limits / cooldown.
    readPlaysToday().then(setPlaysToday);
    readCooldownUntil().then(setCooldownUntil);
    // Hydrate local fallback score (used when not in an org).
    AsyncStorage.getItem(LOCAL_SCORE_KEY).then((v) => {
      if (v) setTotalScore(parseInt(v, 10) || 0);
    });
  }, []);

  // Tick each second so the countdown banner updates live.
  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  // Auto-clear the cooldown when its deadline passes.
  useEffect(() => {
    if (cooldownUntil && now >= cooldownUntil) setCooldownUntil(null);
  }, [now, cooldownUntil]);

  // Live total score for the player from the org leaderboard collection.
  useEffect(() => {
    if (!org || !user) return;
    const ref = doc(db, "organizations", org.orgId, "questScores", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const s = snap.data()?.score;
      if (typeof s === "number") setTotalScore(s);
    }, () => {});
    return unsub;
  }, [org, user]);

  // Live leaderboard (top 20).
  useEffect(() => {
    if (!org) {
      setLeaderboard([]);
      return;
    }
    const q = query(
      collection(db, "organizations", org.orgId, "questScores"),
      orderBy("score", "desc"),
      limit(20),
    );
    const unsub = onSnapshot(q, (snap) => {
      setLeaderboard(
        snap.docs.map((d) => ({
          uid: d.id,
          displayName: d.data().displayName ?? null,
          score: typeof d.data().score === "number" ? d.data().score : 0,
        })),
      );
    }, () => {});
    return unsub;
  }, [org]);

  async function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    } catch {}
  }

  // Live-subscribe to community questions created by members of the org.
  useEffect(() => {
    if (!org) {
      setCommunity([]);
      return;
    }
    const q = query(
      collection(db, "organizations", org.orgId, "questQuestions"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
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
          // Ignore malformed documents (need 4 non-empty choices).
          .filter(
            (c) =>
              c.q.trim().length > 0 &&
              c.choices.length === 4 &&
              c.choices.every((x: unknown) => typeof x === "string" && x.trim().length > 0) &&
              c.answer >= 0 &&
              c.answer <= 3,
          ),
      );
    }, () => {});
    return unsub;
  }, [org]);

  // Playing is normally free. `override=true` means the player chose to
  // pay the Shekel fee to bypass a cooldown or daily-limit block and start
  // an extra round right now.
  async function startGame(override: boolean = false) {
    // Pool check always applies — there has to be something to play.
    const eligible = community.filter((c) => {
      if (user && c.createdBy === user.uid) return false;
      return true;
    });
    if (eligible.length === 0) return;

    if (override) {
      // Overrides cost Shekel and bypass cooldown + daily limit.
      if (totalScore < PLAY_COST_SHEKEL) return;
      // Charge the fee — Firestore for org users, local score otherwise.
      if (org && user) {
        await addToLeaderboard(
          org.orgId,
          user.uid,
          user.displayName ?? null,
          -PLAY_COST_SHEKEL,
        );
      } else {
        const nextScore = Math.max(0, totalScore - PLAY_COST_SHEKEL);
        setTotalScore(nextScore);
        try {
          await AsyncStorage.setItem(LOCAL_SCORE_KEY, String(nextScore));
        } catch {}
      }
      // Clear any active cooldown so the "wait 30 min" block goes away.
      if (cooldownUntil) {
        setCooldownUntil(null);
        try {
          await AsyncStorage.removeItem(COOLDOWN_KEY);
        } catch {}
      }
    } else {
      // Normal free play — enforce limits.
      if (cooldownUntil && Date.now() < cooldownUntil) return;
      if (playsToday >= MAX_ROUNDS_PER_DAY) return;
    }

    // Burn one of today's plays (overrides also count, they just go over).
    const next = await bumpPlaysToday();
    setPlaysToday(next);

    setRound(buildRound(eligible));
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setHearts(STARTING_HEARTS);
    setSelected(null);
    setLocked(false);
    setRoundFailed(false);
    setMode("playing");
  }

  function goToStart() {
    setMode("idle");
  }

  const scoreRef = useRef(score);
  const heartsRef = useRef(hearts);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    heartsRef.current = hearts;
  }, [hearts]);

  async function finishRound() {
    const roundScore = scoreRef.current;
    // Failed = lost all hearts before answering all questions.
    const failed = heartsRef.current <= 0;
    setRoundFailed(failed);

    // Persist the round's points to the leaderboard (or local fallback).
    if (roundScore > 0) {
      if (org && user) {
        await addToLeaderboard(
          org.orgId,
          user.uid,
          user.displayName ?? null,
          roundScore,
        );
      } else {
        // No org → keep a local lifetime score so the player still sees progress.
        const next = totalScore + roundScore;
        setTotalScore(next);
        try {
          await AsyncStorage.setItem(LOCAL_SCORE_KEY, String(next));
        } catch {}
      }
    }

    if (failed) {
      const until = Date.now() + COOLDOWN_AFTER_FAIL_MS;
      setCooldownUntil(until);
      await writeCooldownUntil(until);
    }

    setMode("done");
  }

  function handleAnswer(choiceIdx: number, _remainingMs: number) {
    if (locked) return;
    setLocked(true);
    setSelected(choiceIdx);

    const q = round[qIndex];
    const isCorrect = choiceIdx === q.answer;

    if (isCorrect) {
      // Flat scoring per the rules: +5 per correct answer.
      setScore((s) => s + POINTS_PER_CORRECT);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => (ns > b ? ns : b));
        return ns;
      });
      setCorrectCount((c) => c + 1);
    } else {
      setStreak(0);
      setHearts((h) => {
        const nh = h - 1;
        heartsRef.current = nh;
        return nh;
      });
    }
    // No auto-advance — the player taps "Next" to move on.
  }

  function handleTimeout() {
    if (locked) return;
    setLocked(true);
    setSelected(null);
    setStreak(0);
    setHearts((h) => {
      const nh = h - 1;
      heartsRef.current = nh;
      return nh;
    });
    // No auto-advance — the player taps "Next" to move on.
  }

  function advance() {
    if (heartsRef.current <= 0) {
      finishRound();
      return;
    }
    if (qIndex + 1 >= round.length) {
      finishRound();
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
    setLocked(false);
  }

  return (
    <View style={styles.screen}>
      {mode === "idle" && (
        <StartView
          totalScore={totalScore}
          playsToday={playsToday}
          maxPlays={MAX_ROUNDS_PER_DAY}
          cooldownMsLeft={cooldownUntil ? Math.max(0, cooldownUntil - now) : 0}
          onStart={() => startGame(false)}
          onPayToPlayNow={() => setShowPayConfirm(true)}
          onShowHelp={() => setShowOnboarding(true)}
          onManageQuestions={() => router.push("/quest-questions")}
          hasOrg={!!org}
          communityCount={community.length}
          eligibleCount={
            community.filter((c) => {
              if (user && c.createdBy === user.uid) return false;
              return true;
            }).length
          }
          playCost={PLAY_COST_SHEKEL}
          myCount={
            user ? community.filter((c) => c.createdBy === user.uid).length : 0
          }
          leaderboard={leaderboard}
          currentUid={user?.uid}
          lang={lang}
        />
      )}
      {mode === "playing" && (
        <PlayView
          key={qIndex}
          question={round[qIndex]}
          qIndex={qIndex}
          total={round.length}
          score={score}
          streak={streak}
          hearts={hearts}
          selected={selected}
          locked={locked}
          onAnswer={handleAnswer}
          onTimeout={handleTimeout}
          onQuit={() => setShowQuitConfirm(true)}
          onNext={advance}
          isLast={qIndex + 1 >= round.length}
          orgId={org?.orgId}
          userId={user?.uid}
          userName={user?.displayName ?? null}
          lang={lang}
        />
      )}
      {mode === "done" && (
        <DoneView
          score={score}
          totalScore={totalScore}
          correctCount={correctCount}
          total={round.length}
          bestStreak={bestStreak}
          failed={roundFailed}
          cooldownMsLeft={
            cooldownUntil ? Math.max(0, cooldownUntil - now) : 0
          }
          playsLeft={Math.max(0, MAX_ROUNDS_PER_DAY - playsToday)}
          onPlayAgain={startGame}
          onClose={goToStart}
          lang={lang}
        />
      )}

      <QuestOnboarding
        visible={showOnboarding}
        onDone={dismissOnboarding}
        lang={lang}
      />

      {/* Pay-to-override confirm — charges 10 Shekel, skips cooldown/limit. */}
      <ConfirmDialog
        visible={showPayConfirm}
        title={t("game_pay_confirm_title", lang)}
        message={t("game_pay_confirm_msg", lang)}
        confirmText={`${t("game_play_now", lang)} · −${PLAY_COST_SHEKEL} ${t("game_points", lang)}`}
        cancelText={t("cancel", lang)}
        tone="accent"
        onCancel={() => setShowPayConfirm(false)}
        onConfirm={async () => {
          setShowPayConfirm(false);
          await startGame(true);
          snack.show(
            `−${PLAY_COST_SHEKEL} ${t("game_points", lang)} · ${t(
              "game_paid_msg",
              lang,
            )}`,
          );
        }}
      />

      {/* Quit-round confirm — warns the player they'll lose progress. */}
      <ConfirmDialog
        visible={showQuitConfirm}
        title={t("game_quit_confirm_title", lang)}
        message={t("game_quit_confirm_msg", lang)}
        confirmText={t("game_quit_confirm_yes", lang)}
        cancelText={t("game_quit_confirm_no", lang)}
        tone="danger"
        onCancel={() => setShowQuitConfirm(false)}
        onConfirm={() => {
          setShowQuitConfirm(false);
          goToStart();
        }}
      />

      <Snackbar message={snackMsg} opacity={snack.opacity} />
    </View>
  );
}

function StartView({
  totalScore,
  playsToday,
  maxPlays,
  cooldownMsLeft,
  onStart,
  onPayToPlayNow,
  onShowHelp,
  onManageQuestions,
  hasOrg,
  communityCount,
  eligibleCount,
  myCount,
  leaderboard,
  currentUid,
  playCost,
  lang,
}: {
  totalScore: number;
  playsToday: number;
  maxPlays: number;
  cooldownMsLeft: number;
  onStart: () => void;
  onPayToPlayNow: () => void;
  onShowHelp: () => void;
  onManageQuestions: () => void;
  hasOrg: boolean;
  communityCount: number;
  eligibleCount: number;
  myCount: number;
  leaderboard: LeaderboardEntry[];
  currentUid: string | undefined;
  playCost: number;
  lang: Language;
}) {
  const playsLeft = Math.max(0, maxPlays - playsToday);
  const cooldownActive = cooldownMsLeft > 0;
  const noPlaysLeft = playsLeft === 0 && !cooldownActive;
  // There has to be something to play regardless of payment state.
  const noEligibleQuestions = eligibleCount === 0;
  // Reasons you'd normally be blocked that can be unlocked by paying Shekel.
  const blockedByTime = cooldownActive || noPlaysLeft;
  // Can the player pay the fee to bypass a time-based block right now?
  const canPayToOverride =
    blockedByTime &&
    hasOrg &&
    !noEligibleQuestions &&
    totalScore >= playCost;
  // Button is fully disabled only when nothing can make play happen.
  const playDisabled =
    !hasOrg ||
    noEligibleQuestions ||
    (blockedByTime && !canPayToOverride);
  const cooldownLabel = formatCooldown(cooldownMsLeft);
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, [float]);
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.startContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.startIconWrap, { transform: [{ translateY }] }]}
        >
          <View style={styles.startIconCircle}>
            <Text style={styles.startIconText}>✞</Text>
          </View>
        </Animated.View>

        <Text style={styles.startTitle}>{t("game_title", lang)}</Text>
        <Text style={styles.startSubtitle}>{t("game_subtitle", lang)}</Text>

        {/* Cooldown / daily-limit / no-questions notice */}
        {cooldownActive && (
          <View style={styles.noticeCard}>
            <Ionicons name="hourglass" size={18} color={C.wrong} />
            <Text style={styles.noticeText}>
              {t("game_cooldown_msg", lang)} {cooldownLabel}
            </Text>
          </View>
        )}
        {!cooldownActive && noPlaysLeft && (
          <View style={[styles.noticeCard, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="moon" size={18} color={C.gold} />
            <Text style={[styles.noticeText, { color: C.gold }]}>
              {t("game_daily_limit_msg", lang)}
            </Text>
          </View>
        )}
        {!cooldownActive && !noPlaysLeft && !hasOrg && (
          <View
            style={[
              styles.noticeCard,
              { backgroundColor: "rgba(91,117,83,0.10)" },
            ]}
          >
            <Ionicons name="people-outline" size={18} color={C.primary} />
            <Text style={[styles.noticeText, { color: C.primary }]}>
              {t("game_need_org_msg", lang)}
            </Text>
          </View>
        )}
        {!cooldownActive && !noPlaysLeft && hasOrg && noEligibleQuestions && (
          <View
            style={[
              styles.noticeCard,
              { backgroundColor: "rgba(192,149,108,0.15)" },
            ]}
          >
            <Ionicons name="bulb" size={18} color={C.accent} />
            <Text style={[styles.noticeText, { color: C.accent }]}>
              {communityCount > 0 && myCount === communityCount
                ? t("game_only_own_msg", lang)
                : t("game_no_questions_msg", lang)}
            </Text>
          </View>
        )}
        {/* When blocked by cooldown/limit AND you can't pay to override,
            nudge the player to earn Shekel by creating questions. */}
        {blockedByTime &&
          hasOrg &&
          !noEligibleQuestions &&
          totalScore < playCost && (
            <View
              style={[
                styles.noticeCard,
                { backgroundColor: "rgba(192,149,108,0.15)" },
              ]}
            >
              <Ionicons name="cash-outline" size={18} color={C.accent} />
              <Text style={[styles.noticeText, { color: C.accent }]}>
                {t("game_insufficient_shekel", lang)}
              </Text>
            </View>
          )}

        <View style={styles.statsGrid}>
          <StatCard
            icon="trophy"
            iconColor={C.gold}
            label={t("game_total_score", lang)}
            value={String(totalScore)}
          />
          <StatCard
            icon="calendar"
            iconColor={C.primary}
            label={t("game_plays_today", lang)}
            value={`${playsLeft} / ${maxPlays}`}
          />
          <StatCard
            icon="heart"
            iconColor={C.heart}
            label={t("game_hearts", lang)}
            value={String(STARTING_HEARTS)}
          />
          <StatCard
            icon="star"
            iconColor={C.accent}
            label={t("game_per_correct", lang)}
            value={`+${POINTS_PER_CORRECT}`}
          />
        </View>

        {/* Leaderboard — inline on the start page */}
        <View style={styles.boardCard}>
          <View style={styles.boardHeader}>
            <Ionicons name="trophy" size={18} color={C.gold} />
            <Text style={styles.boardTitle}>
              {t("game_leaderboard_title", lang)}
            </Text>
          </View>

          {!hasOrg ? (
            <Text style={styles.boardEmpty}>
              {t("game_leaderboard_need_org", lang)}
            </Text>
          ) : leaderboard.length === 0 ? (
            <Text style={styles.boardEmpty}>
              {t("game_leaderboard_empty", lang)}
            </Text>
          ) : (
            <View style={{ gap: 6 }}>
              {leaderboard.slice(0, 10).map((e, i) => {
                const isMe = e.uid === currentUid;
                const medal =
                  i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <View
                    key={e.uid}
                    style={[
                      styles.boardRow,
                      isMe && styles.boardRowMe,
                      i === 0 && styles.boardRowFirst,
                    ]}
                  >
                    <View style={styles.boardRank}>
                      {medal ? (
                        <Text style={styles.boardMedal}>{medal}</Text>
                      ) : (
                        <Text style={styles.boardRankText}>{i + 1}</Text>
                      )}
                    </View>
                    <UserAvatar
                      uid={e.uid}
                      name={e.displayName}
                      size={28}
                    />
                    <Text
                      style={[
                        styles.boardName,
                        isMe && styles.boardNameMe,
                      ]}
                      numberOfLines={1}
                    >
                      {e.displayName ||
                        t("home_member_fallback", lang) ||
                        "—"}
                      {isMe ? "  · " + t("game_leaderboard_you", lang) : ""}
                    </Text>
                    <Text style={styles.boardScore}>{e.score}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Bottom-docked action group: Play + Create question + Help */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={canPayToOverride ? onPayToPlayNow : onStart}
          disabled={playDisabled}
          style={[
            styles.playBtn,
            playDisabled && { opacity: 0.5 },
            canPayToOverride && { backgroundColor: C.gold },
          ]}
        >
          <Ionicons
            name={canPayToOverride ? "flash" : "play"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.playBtnText}>
            {canPayToOverride
              ? `${t("game_play_now", lang)}  ·  −${playCost} ${t("game_points", lang)}`
              : cooldownActive
              ? `${t("game_play", lang)}  ·  ${cooldownLabel}`
              : noPlaysLeft
              ? t("game_daily_limit_short", lang)
              : t("game_play", lang)}
          </Text>
        </Pressable>
        <Pressable
          onPress={onManageQuestions}
          disabled={!hasOrg}
          style={[styles.helpBtn, !hasOrg && { opacity: 0.5 }]}
          accessibilityLabel={t("game_manage_questions", lang)}
          hitSlop={6}
        >
          <Ionicons name="add" size={22} color={C.primary} />
        </Pressable>
        <Pressable
          onPress={onShowHelp}
          style={styles.helpBtn}
          accessibilityLabel={t("onboard_help", lang)}
          hitSlop={6}
        >
          <Ionicons name="help-circle-outline" size={22} color={C.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HowRow({
  icon,
  color,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  text: string;
}) {
  return (
    <View style={styles.howRow}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.howText}>{text}</Text>
    </View>
  );
}

function PlayView({
  question,
  qIndex,
  total,
  score,
  streak,
  hearts,
  selected,
  locked,
  onAnswer,
  onTimeout,
  onQuit,
  onNext,
  isLast,
  orgId,
  userId,
  userName,
  lang,
}: {
  question: Question;
  qIndex: number;
  total: number;
  score: number;
  streak: number;
  hearts: number;
  selected: number | null;
  locked: boolean;
  onAnswer: (idx: number, remainingMs: number) => void;
  onTimeout: () => void;
  onQuit: () => void;
  onNext: () => void;
  isLast: boolean;
  orgId: string | undefined;
  userId: string | undefined;
  userName: string | null;
  lang: Language;
}) {
  const timerAnim = useRef(new Animated.Value(1)).current;
  const startedAt = useRef<number>(Date.now());
  const timeoutFired = useRef(false);

  const shake = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(12)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [displayLang, setDisplayLang] = useState<Language>(lang);
  const translated = resolveTranslation(question, displayLang);
  const langs = availableLanguages(question);

  // Reset display language to user's default when question changes
  useEffect(() => { setDisplayLang(lang); }, [qIndex, lang]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslate, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();

    timerAnim.setValue(1);
    startedAt.current = Date.now();
    timeoutFired.current = false;
    const anim = Animated.timing(timerAnim, {
      toValue: 0,
      duration: TIME_PER_QUESTION_MS,
      useNativeDriver: false,
      easing: Easing.linear,
    });
    anim.start(({ finished }) => {
      if (finished && !timeoutFired.current && !locked) {
        timeoutFired.current = true;
        onTimeout();
      }
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  // Freeze the timer (and the running character) the moment the player
  // picks an answer or the question times out. The bar visibly stops
  // wherever it was, so the player isn't pressured while reading the
  // result snackbar.
  useEffect(() => {
    if (locked) {
      timerAnim.stopAnimation();
    }
  }, [locked, timerAnim]);

  useEffect(() => {
    if (selected !== null && selected !== question.answer) {
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [selected, question.answer, shake]);

  const translateX = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });

  const timerWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const timerColor = timerAnim.interpolate({
    inputRange: [0, 0.33, 1],
    outputRange: [C.wrong, C.gold, C.primary],
  });

  function pressChoice(idx: number) {
    if (locked) return;
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, TIME_PER_QUESTION_MS - elapsed);
    onAnswer(idx, remaining);
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.playRootContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.hudRow}>
        <Pressable onPress={onQuit} hitSlop={12} style={styles.hudBtn}>
          <Ionicons name="close" size={22} color={C.textMuted} />
        </Pressable>

        <View style={styles.heartsRow}>
          {Array.from({ length: STARTING_HEARTS }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < hearts ? "heart" : "heart-outline"}
              size={22}
              color={i < hearts ? C.heart : "#D1D5DB"}
              style={{ marginHorizontal: 2 }}
            />
          ))}
        </View>

        <View style={styles.scorePill}>
          <Ionicons name="star" size={14} color={C.gold} />
          <Text style={styles.scorePillText}>{score}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < qIndex && styles.progressDotDone,
              i === qIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {streak >= 2 && (
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={14} color={C.gold} />
          <Text style={styles.streakPillText}>
            {t("game_streak", lang)} · {streak}x
          </Text>
        </View>
      )}

      <View style={styles.timerTrack}>
        <Animated.View
          style={[
            styles.timerFill,
            { width: timerWidth, backgroundColor: timerColor },
          ]}
        />
      </View>

      <Animated.View
        style={[
          styles.questionCard,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslate }, { translateX }],
          },
        ]}
      >
        <View style={styles.questionMetaRow}>
          <Text style={styles.questionIndex}>
            {qIndex + 1} / {total}
          </Text>
          {question.createdByName && (
            <View style={styles.byPill}>
              <Ionicons name="person" size={10} color={C.accent} />
              <Text style={styles.byPillText}>
                {t("game_by", lang)} {question.createdByName}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.questionText}>{translated.q}</Text>
        {langs.length > 1 && (
          <View style={styles.langSwitchRow}>
            {langs.map((l) => (
              <Pressable
                key={l}
                onPress={() => setDisplayLang(l)}
                style={[
                  styles.langSwitchChip,
                  displayLang === l && styles.langSwitchChipActive,
                ]}
              >
                <Text style={[
                  styles.langSwitchText,
                  displayLang === l && styles.langSwitchTextActive,
                ]}>
                  {LANG_FLAGS[l]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {question.ref && (
          <View style={styles.refPill}>
            <Ionicons name="book-outline" size={12} color={C.primary} />
            <Text style={styles.refPillText}>{question.ref}</Text>
          </View>
        )}
      </Animated.View>

      {/* Result snackbar — appears above the choices once the answer is locked */}
      {locked &&
        (() => {
          const answeredCorrectly =
            selected !== null && selected === question.answer;
          const timedOut = selected === null;
          const tone = answeredCorrectly ? "success" : "fail";
          const customMsg = answeredCorrectly
            ? translated.successMsg
            : translated.failMsg;
          const defaultMsg = answeredCorrectly
            ? t("quest_correct_title", lang)
            : timedOut
            ? t("quest_timeout_title", lang)
            : t("quest_wrong_title", lang);
          return (
            <View
              style={[
                styles.snackbar,
                tone === "success"
                  ? styles.snackbarSuccess
                  : styles.snackbarFail,
              ]}
            >
              <View
                style={[
                  styles.snackbarIconWrap,
                  tone === "success"
                    ? { backgroundColor: "#DCFCE7" }
                    : { backgroundColor: "#FEE2E2" },
                ]}
              >
                <Ionicons
                  name={answeredCorrectly ? "checkmark" : "close"}
                  size={18}
                  color={answeredCorrectly ? C.correct : C.wrong}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.snackbarTitle,
                    tone === "success"
                      ? { color: "#14532D" }
                      : { color: "#7F1D1D" },
                  ]}
                >
                  {defaultMsg}
                  {question.createdByName && customMsg
                    ? ` · ${question.createdByName}`
                    : ""}
                </Text>
                {customMsg && (
                  <Text
                    style={[
                      styles.snackbarText,
                      tone === "success"
                        ? { color: "#166534" }
                        : { color: "#991B1B" },
                    ]}
                  >
                    {tone === "success" ? "🎉 " : "😈 "}
                    {customMsg}
                  </Text>
                )}
              </View>
            </View>
          );
        })()}

      <View style={styles.choicesWrap}>
        {translated.choices.map((choice, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === question.answer;
          const showResult = locked;
          let bg = C.card;
          let border = C.border;
          let textColor = C.text;
          let icon: keyof typeof Ionicons.glyphMap | null = null;
          let iconColor = C.primary;
          if (showResult) {
            if (isCorrect) {
              bg = C.correctSoft;
              border = C.correct;
              textColor = "#14532D";
              icon = "checkmark-circle";
              iconColor = C.correct;
            } else if (isSelected) {
              bg = C.wrongSoft;
              border = C.wrong;
              textColor = "#7F1D1D";
              icon = "close-circle";
              iconColor = C.wrong;
            }
          }
          return (
            <Pressable
              key={idx}
              onPress={() => pressChoice(idx)}
              disabled={locked}
              style={({ pressed }) => [
                styles.choiceBtn,
                {
                  backgroundColor: bg,
                  borderColor: border,
                  opacity: pressed && !locked ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.choiceLabel}>
                <Text style={styles.choiceLetter}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={[styles.choiceText, { color: textColor }]}>
                {choice}
              </Text>
              {icon && <Ionicons name={icon} size={22} color={iconColor} />}
            </Pressable>
          );
        })}
      </View>

      {/* Per-question comments — visible after the answer is revealed. */}
      {locked && (
        <QuestionComments
          orgId={orgId}
          questionId={question.id}
          userId={userId}
          userName={userName}
          lang={lang}
        />
      )}
    </ScrollView>

    {/* Bottom-docked Next button — hidden when keyboard is open */}
    {locked && !keyboardVisible && (
      <View style={styles.bottomBar}>
        <Pressable onPress={onNext} style={styles.playBtn}>
          <Text style={styles.playBtnText}>
            {isLast
              ? t("quest_finish", lang)
              : t("quest_next", lang)}
          </Text>
          <Ionicons
            name={isLast ? "flag" : "arrow-forward"}
            size={18}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    )}
    </View>
  );
}

function DoneView({
  score,
  totalScore,
  correctCount,
  total,
  bestStreak,
  failed,
  cooldownMsLeft,
  playsLeft,
  onPlayAgain,
  onClose,
  lang,
}: {
  score: number;
  totalScore: number;
  correctCount: number;
  total: number;
  bestStreak: number;
  failed: boolean;
  cooldownMsLeft: number;
  playsLeft: number;
  onPlayAgain: () => void;
  onClose: () => void;
  lang: Language;
}) {
  const cooldownActive = cooldownMsLeft > 0;
  const noPlaysLeft = !cooldownActive && playsLeft === 0;
  const playAgainDisabled = cooldownActive || noPlaysLeft;

  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  const { verseKey, titleKey } = useMemo(() => {
    if (failed)
      return {
        titleKey: "game_result_failed" as const,
        verseKey: "game_verse_try" as const,
      };
    const pct = correctCount / Math.max(1, total);
    if (pct >= 0.9)
      return { titleKey: "game_result_great" as const, verseKey: "game_verse_great" as const };
    if (pct >= 0.5)
      return { titleKey: "game_result_good" as const, verseKey: "game_verse_good" as const };
    return { titleKey: "game_result_try" as const, verseKey: "game_verse_try" as const };
  }, [correctCount, total, failed]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.doneContent}>
        <Animated.View
          style={[styles.doneHero, { opacity, transform: [{ scale }] }]}
        >
          <View
            style={[
              styles.doneIconCircle,
              failed && { backgroundColor: "#FEE2E2" },
            ]}
          >
            <Ionicons
              name={failed ? "skull" : "ribbon"}
              size={44}
              color={failed ? C.wrong : C.primary}
            />
          </View>
          <Text style={styles.doneTitle}>{t(titleKey, lang)}</Text>
          <Text style={styles.doneScore}>+{score}</Text>
          <Text style={styles.doneScoreLabel}>{t("game_points", lang)}</Text>
        </Animated.View>

        {/* Cooldown banner — shown only after a failure */}
        {cooldownActive && (
          <View style={styles.noticeCard}>
            <Ionicons name="hourglass" size={18} color={C.wrong} />
            <Text style={styles.noticeText}>
              {t("game_cooldown_msg", lang)} {formatCooldown(cooldownMsLeft)}
            </Text>
          </View>
        )}

        <View style={styles.resultGrid}>
          <StatCard
            icon="checkmark-done"
            iconColor={C.correct}
            label={t("game_correct", lang)}
            value={`${correctCount}/${total}`}
          />
          <StatCard
            icon="flame"
            iconColor={C.gold}
            label={t("game_best_streak", lang)}
            value={String(bestStreak)}
          />
          <StatCard
            icon="trophy"
            iconColor={C.accent}
            label={t("game_total_score", lang)}
            value={String(totalScore)}
          />
        </View>

        <View style={styles.verseCard}>
          <Ionicons name="book" size={20} color={C.primary} />
          <Text style={styles.verseText}>{t(verseKey, lang)}</Text>
        </View>

        <Pressable onPress={onClose} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>{t("game_done", lang)}</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom-docked primary action */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={onPlayAgain}
          disabled={playAgainDisabled}
          style={[styles.playBtn, playAgainDisabled && { opacity: 0.5 }]}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.playBtnText}>
            {cooldownActive
              ? `${t("game_play_again", lang)}  ·  ${formatCooldown(cooldownMsLeft)}`
              : noPlaysLeft
              ? t("game_daily_limit_short", lang)
              : t("game_play_again", lang)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ===== Confirm dialog (reused for pay-to-play + quit-round flows) =====
function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  tone = "primary",
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone?: "primary" | "danger" | "accent";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.9);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  if (!visible) return null;

  const confirmBg =
    tone === "danger"
      ? C.wrong
      : tone === "accent"
      ? C.gold
      : C.primary;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <Animated.View style={[confirmStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[confirmStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <Text style={confirmStyles.title}>{title}</Text>
          <Text style={confirmStyles.message}>{message}</Text>
          <View style={confirmStyles.actions}>
            <Pressable onPress={onCancel} style={confirmStyles.cancelBtn}>
              <Text style={confirmStyles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[confirmStyles.confirmBtn, { backgroundColor: confirmBg }]}
            >
              <Text style={confirmStyles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const confirmStyles = StyleSheet.create({
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
    borderRadius: 20,
    padding: 22,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: C.primaryDark,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: C.textMuted,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
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
  confirmBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

// ===== Per-question comment thread (shown after the answer is revealed) =====
type QuestionComment = {
  id: string;
  text: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: Date | null;
};

function QuestionComments({
  orgId,
  questionId,
  userId,
  userName,
  lang,
}: {
  orgId: string | undefined;
  questionId: string | undefined;
  userId: string | undefined;
  userName: string | null;
  lang: Language;
}) {
  const [comments, setComments] = useState<QuestionComment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!orgId || !questionId) return;
    const q = query(
      collection(
        db,
        "organizations",
        orgId,
        "questQuestions",
        questionId,
        "comments",
      ),
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
  }, [orgId, questionId]);

  async function handleSend() {
    if (!orgId || !questionId || !userId || !text.trim() || sending) return;
    const body = text.trim();
    setSending(true);
    setText("");
    try {
      await addDoc(
        collection(
          db,
          "organizations",
          orgId,
          "questQuestions",
          questionId,
          "comments",
        ),
        {
          text: body,
          createdBy: userId,
          createdByName: userName,
          createdAt: serverTimestamp(),
        },
      );
      notifyMentionedUsers({
        orgId,
        senderUid: userId,
        senderName: userName,
        text: body,
        screen: "game",
      });
    } catch {
      // restore input on failure so user can retry
      setText(body);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(cid: string) {
    if (!orgId || !questionId) return;
    try {
      await deleteDoc(
        doc(
          db,
          "organizations",
          orgId,
          "questQuestions",
          questionId,
          "comments",
          cid,
        ),
      );
    } catch {
      // ignore
    }
  }

  return (
    <View style={commentStyles.card}>
      <View style={commentStyles.header}>
        <Ionicons name="chatbubble-ellipses" size={16} color={C.primary} />
        <Text style={commentStyles.headerTitle}>
          {t("quest_comments_title", lang)} ({comments.length})
        </Text>
      </View>

      {comments.length === 0 ? (
        <Text style={commentStyles.empty}>
          {t("quest_comments_empty", lang)}
        </Text>
      ) : (
        <View style={{ gap: 8 }}>
          {comments.map((c) => (
            <View key={c.id} style={commentStyles.row}>
              <UserAvatar
                uid={c.createdBy}
                name={c.createdByName}
                size={26}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={commentStyles.name} numberOfLines={1}>
                  {c.createdByName || t("notif_someone", lang)}
                </Text>
                <Text style={commentStyles.text}>{c.text}</Text>
              </View>
              {c.createdBy === userId && (
                <Pressable
                  onPress={() => handleDelete(c.id)}
                  hitSlop={6}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color={C.wrong}
                  />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={commentStyles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("quest_comments_placeholder", lang)}
          placeholderTextColor="#A3A89E"
          style={commentStyles.input}
          multiline
          maxLength={280}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={[
            commentStyles.sendBtn,
            (!text.trim() || sending) && { opacity: 0.5 },
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
  );
}

const commentStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: C.primaryDark,
  },
  empty: {
    fontSize: 12,
    fontStyle: "italic",
    color: C.textMuted,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#F9F7F4",
    borderRadius: 10,
    padding: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
  },
  text: {
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 2,
  },
  input: {
    flex: 1,
    backgroundColor: "#F9F7F4",
    borderColor: "rgba(0,0,0,0.08)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.text,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});

// ===== Onboarding =====
type OnboardStep = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  titleKey:
    | "onboard_1_title"
    | "onboard_2_title"
    | "onboard_3_title"
    | "onboard_4_title";
  descKey:
    | "onboard_1_desc"
    | "onboard_2_desc"
    | "onboard_3_desc"
    | "onboard_4_desc";
};

const ONBOARD_STEPS: OnboardStep[] = [
  {
    // Step 1 — community-authored questions, +5 per correct answer
    icon: "people",
    color: C.primary,
    bgColor: "#E8F0E5",
    titleKey: "onboard_1_title",
    descKey: "onboard_1_desc",
  },
  {
    // Step 2 — 3 lives, 30-min cooldown if you fail
    icon: "heart",
    color: C.heart,
    bgColor: "#FEE2E2",
    titleKey: "onboard_2_title",
    descKey: "onboard_2_desc",
  },
  {
    // Step 3 — 5 rounds/day, leaderboard honors top players
    icon: "trophy",
    color: C.gold,
    bgColor: "#FEF3C7",
    titleKey: "onboard_3_title",
    descKey: "onboard_3_desc",
  },
  {
    // Step 4 — challenge back: create your own questions for +2 each
    icon: "add-circle",
    color: C.accent,
    bgColor: "#F7EDE0",
    titleKey: "onboard_4_title",
    descKey: "onboard_4_desc",
  },
];

function QuestOnboarding({
  visible,
  onDone,
  lang,
}: {
  visible: boolean;
  onDone: () => void;
  lang: Language;
}) {
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!visible) return;
    fade.setValue(0);
    slide.setValue(16);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        damping: 16,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, visible, fade, slide]);

  // Reset to first step when the modal is opened fresh.
  useEffect(() => {
    if (visible) setStep(0);
  }, [visible]);

  if (!visible) return null;

  const cur = ONBOARD_STEPS[step];
  const isLast = step === ONBOARD_STEPS.length - 1;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDone}>
      <View style={onbStyles.backdrop}>
        <View style={onbStyles.card}>
          <Pressable onPress={onDone} style={onbStyles.skipBtn} hitSlop={10}>
            <Text style={onbStyles.skipText}>{t("onboard_skip", lang)}</Text>
          </Pressable>

          <Animated.View
            style={[
              onbStyles.body,
              { opacity: fade, transform: [{ translateY: slide }] },
            ]}
          >
            <View
              style={[onbStyles.iconCircle, { backgroundColor: cur.bgColor }]}
            >
              <Ionicons name={cur.icon} size={56} color={cur.color} />
            </View>
            <Text style={onbStyles.title}>{t(cur.titleKey, lang)}</Text>
            <Text style={onbStyles.desc}>{t(cur.descKey, lang)}</Text>
          </Animated.View>

          <View style={onbStyles.dotsRow}>
            {ONBOARD_STEPS.map((_, i) => (
              <View
                key={i}
                style={[onbStyles.dot, i === step && onbStyles.dotActive]}
              />
            ))}
          </View>

          <View style={onbStyles.actions}>
            {step > 0 && (
              <Pressable
                onPress={() => setStep((s) => Math.max(0, s - 1))}
                style={onbStyles.backBtn}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={20} color={C.textMuted} />
                <Text style={onbStyles.backText}>
                  {t("onboard_back", lang)}
                </Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => (isLast ? onDone() : setStep((s) => s + 1))}
              style={onbStyles.nextBtn}
            >
              <Text style={onbStyles.nextText}>
                {isLast ? t("onboard_start", lang) : t("onboard_next", lang)}
              </Text>
              {!isLast && (
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const onbStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  skipBtn: {
    alignSelf: "flex-end",
    padding: 4,
  },
  skipText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  body: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: C.primaryDark,
    textAlign: "center",
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    color: C.textMuted,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    backgroundColor: C.primary,
    width: 20,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  backText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  startContent: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 16,
  },
  helpBtn: {
    width: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  startIconWrap: { alignItems: "center", marginTop: 8 },
  startIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  startIconText: { color: "#FFFFFF", fontSize: 52, fontWeight: "300" },
  startTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: C.primaryDark,
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  startSubtitle: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: C.primaryDark,
    marginTop: 4,
  },
  statLabel: { fontSize: 12, color: C.textMuted, fontWeight: "600" },
  howCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  howTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primaryDark,
    marginBottom: 4,
  },
  howRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  howText: { fontSize: 14, color: C.text, flex: 1 },

  langFilterCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  langFilterLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  langFilterRow: {
    flexDirection: "row",
    gap: 6,
  },
  langFilterChip: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  langFilterChipActive: {
    backgroundColor: C.primary,
  },
  langFlag: {
    fontSize: 18,
  },
  langFilterChipCount: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textMuted,
  },
  langFilterChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  langFilterChipTextActive: {
    color: "#FFFFFF",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: C.wrong,
  },
  boardCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  boardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },
  boardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.primaryDark,
  },
  boardEmpty: {
    fontSize: 13,
    color: C.textMuted,
    fontStyle: "italic",
    paddingVertical: 8,
    textAlign: "center",
  },
  boardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F9F7F4",
    borderRadius: 10,
  },
  boardRowMe: {
    backgroundColor: "#E8F0E5",
    borderWidth: 1,
    borderColor: C.primary,
  },
  boardRowFirst: {
    backgroundColor: "#FEF3C7",
  },
  boardRank: {
    width: 24,
    alignItems: "center",
  },
  boardRankText: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textMuted,
  },
  boardMedal: { fontSize: 16 },
  boardName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },
  boardNameMe: {
    color: C.primaryDark,
    fontWeight: "800",
  },
  boardScore: {
    fontSize: 14,
    fontWeight: "800",
    color: C.primaryDark,
  },

  // Bottom-docked container — matches the Calendar/Tasks segmented switcher:
  // same horizontal margin, bottom margin, padding, and light-green wrapper tint.
  bottomBar: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 4,
    backgroundColor: "rgba(91,117,83,0.08)",
    borderRadius: 14,
  },
  playBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  playBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  playRoot: { flex: 1, padding: 20, paddingTop: 56, gap: 14 },
  // Same look as playRoot but shaped for ScrollView's contentContainerStyle
  // (flex:1 doesn't apply there; use paddingBottom to leave space above the
  // fixed Next button bottom bar).
  playRootContent: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 14,
  },
  hudRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hudBtn: { padding: 4 },
  heartsRow: { flexDirection: "row" },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },
  scorePillText: { fontWeight: "800", color: C.primaryDark, fontSize: 14 },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
  },
  progressDot: {
    height: 4,
    flex: 1,
    backgroundColor: C.neutral,
    borderRadius: 2,
  },
  progressDotDone: { backgroundColor: C.primary },
  progressDotActive: { backgroundColor: C.accent },
  streakPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
  },
  streakPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.gold,
  },
  timerTrack: {
    height: 6,
    backgroundColor: C.neutral,
    borderRadius: 3,
    overflow: "hidden",
  },
  timerFill: { height: "100%", borderRadius: 3 },
  questionCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  questionIndex: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  byPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(192,149,108,0.15)",
  },
  byPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.accent,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    color: C.primaryDark,
    lineHeight: 28,
  },
  langSwitchRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  langSwitchChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  langSwitchChipActive: {
    backgroundColor: C.primary,
  },
  langSwitchText: {
    fontSize: 14,
  },
  langSwitchTextActive: {
    fontSize: 14,
  },
  refPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F0FDF4",
  },
  refPillText: { fontSize: 11, color: C.primary, fontWeight: "600" },

  snackbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  snackbarSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  snackbarFail: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  snackbarIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  snackbarTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  snackbarText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
    lineHeight: 16,
  },

  choicesWrap: { gap: 10, marginTop: 4 },
  choiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  choiceLabel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  choiceLetter: { fontSize: 13, fontWeight: "800", color: C.textMuted },
  choiceText: { flex: 1, fontSize: 15, fontWeight: "600" },

  doneContent: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 16,
  },
  doneHero: { alignItems: "center", gap: 6, marginBottom: 8 },
  doneIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.primaryDark,
    textAlign: "center",
  },
  newBestPill: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    marginTop: 4,
  },
  newBestPillText: { color: C.gold, fontWeight: "800", fontSize: 12 },
  doneScore: {
    fontSize: 56,
    fontWeight: "900",
    color: C.primaryDark,
    letterSpacing: -2,
    marginTop: 8,
  },
  doneScoreLabel: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultGrid: {
    flexDirection: "row",
    gap: 10,
  },
  verseCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "flex-start",
  },
  verseText: {
    flex: 1,
    fontSize: 14,
    color: "#14532D",
    lineHeight: 22,
    fontStyle: "italic",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  secondaryBtnText: {
    color: C.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
});
