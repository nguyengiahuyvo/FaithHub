import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { t, type Language } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

// ===== Game constants =====
const QUESTIONS_PER_ROUND = 10;
const TIME_PER_QUESTION_MS = 15000;
const BASE_POINTS = 100;
const MAX_TIME_BONUS = 50;
const STARTING_HEARTS = 3;
const BEST_SCORE_KEY = "@faithhub/verseQuest/bestScore";

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

// ===== Question pool =====
type Question = {
  q: string;
  choices: string[];
  answer: number;
  ref?: string;
};

const QUESTIONS: Question[] = [
  { q: "Who built the ark?", choices: ["Moses", "Noah", "Abraham", "Jonah"], answer: 1, ref: "Genesis 6" },
  { q: "How many days did it rain during the Flood?", choices: ["7", "12", "40", "100"], answer: 2, ref: "Genesis 7:12" },
  { q: "In which town was Jesus born?", choices: ["Nazareth", "Jerusalem", "Bethlehem", "Capernaum"], answer: 2, ref: "Luke 2:4-7" },
  { q: "What is the first book of the Bible?", choices: ["Exodus", "Genesis", "Job", "Psalms"], answer: 1 },
  { q: "What is the last book of the Bible?", choices: ["Revelation", "Jude", "Malachi", "Acts"], answer: 0 },
  { q: "How many disciples did Jesus have?", choices: ["7", "10", "12", "24"], answer: 2 },
  { q: "Who denied Jesus three times?", choices: ["Judas", "Peter", "John", "Thomas"], answer: 1, ref: "Luke 22" },
  { q: "What did God create on the first day?", choices: ["Stars", "Animals", "Light", "Man"], answer: 2, ref: "Genesis 1:3" },
  { q: "Who was swallowed by a great fish?", choices: ["Jonah", "Job", "Joshua", "Joseph"], answer: 0 },
  { q: "How many books are in the New Testament?", choices: ["24", "27", "39", "66"], answer: 1 },
  { q: "Who led the Israelites out of Egypt?", choices: ["Aaron", "Joshua", "Moses", "David"], answer: 2 },
  { q: "What did David use to defeat Goliath?", choices: ["Spear", "Sword", "Sling and stone", "Bow"], answer: 2, ref: "1 Samuel 17" },
  { q: "Who was thrown into the lions' den?", choices: ["Daniel", "Elijah", "Elisha", "Ezekiel"], answer: 0 },
  { q: "How many plagues struck Egypt?", choices: ["7", "10", "12", "40"], answer: 1 },
  { q: "What is the shortest verse in the Bible?", choices: ["God is love.", "Jesus wept.", "Pray always.", "Do not fear."], answer: 1, ref: "John 11:35" },
  { q: "Who betrayed Jesus with a kiss?", choices: ["Peter", "John", "Judas Iscariot", "Thomas"], answer: 2 },
  { q: "Which Gospel comes first in the New Testament?", choices: ["Mark", "Luke", "John", "Matthew"], answer: 3 },
  { q: "How many days was Jesus in the tomb?", choices: ["1", "3", "7", "40"], answer: 1 },
  { q: "Who baptized Jesus?", choices: ["Peter", "Paul", "John the Baptist", "Andrew"], answer: 2 },
  { q: "What was Paul's name before his conversion?", choices: ["Simon", "Saul", "Silas", "Stephen"], answer: 1 },
  { q: "On what mountain did Moses receive the Ten Commandments?", choices: ["Mount Zion", "Mount Sinai", "Mount Ararat", "Mount Carmel"], answer: 1 },
  { q: "Who was the strongest man in the Bible?", choices: ["Samson", "David", "Goliath", "Saul"], answer: 0 },
  { q: "Who was the father of John the Baptist?", choices: ["Joseph", "Zacharias", "Elijah", "Herod"], answer: 1 },
  { q: "What did Jesus turn water into at Cana?", choices: ["Oil", "Wine", "Milk", "Honey"], answer: 1, ref: "John 2" },
  { q: "Who wrote most of the Psalms?", choices: ["Solomon", "David", "Moses", "Asaph"], answer: 1 },
  { q: "How many people were saved on the ark?", choices: ["4", "8", "12", "40"], answer: 1 },
  { q: "Who was the first man?", choices: ["Cain", "Abel", "Adam", "Seth"], answer: 2 },
  { q: "What fruit is commonly associated with the Fall?", choices: ["Apple", "Fig", "Not specified", "Grape"], answer: 2 },
  { q: "Who was the wisest king of Israel?", choices: ["David", "Saul", "Solomon", "Hezekiah"], answer: 2 },
  { q: "What does \"Immanuel\" mean?", choices: ["Prince of Peace", "God with us", "Holy One", "Chosen Son"], answer: 1, ref: "Matthew 1:23" },
  { q: "How many chapters are in the book of Psalms?", choices: ["100", "120", "150", "176"], answer: 2 },
  { q: "Who climbed a tree to see Jesus?", choices: ["Nicodemus", "Zacchaeus", "Bartimaeus", "Lazarus"], answer: 1, ref: "Luke 19" },
  { q: "Where did Jesus perform His first miracle?", choices: ["Jerusalem", "Bethany", "Cana", "Nazareth"], answer: 2 },
  { q: "How many books are in the Bible (Protestant)?", choices: ["54", "66", "73", "81"], answer: 1 },
  { q: "Who was the mother of Jesus?", choices: ["Martha", "Mary", "Elizabeth", "Ruth"], answer: 1 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(): Question[] {
  return shuffle(QUESTIONS).slice(0, QUESTIONS_PER_ROUND);
}

type Mode = "idle" | "playing" | "done";

export default function GameScreen() {
  const { lang } = useLanguage();

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
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(BEST_SCORE_KEY)
      .then((v) => {
        if (v) setBestScore(parseInt(v, 10) || 0);
      })
      .catch(() => {});
  }, []);

  function startGame() {
    setRound(buildRound());
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setHearts(STARTING_HEARTS);
    setSelected(null);
    setLocked(false);
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
    const final = scoreRef.current;
    if (final > bestScore) {
      setBestScore(final);
      try {
        await AsyncStorage.setItem(BEST_SCORE_KEY, String(final));
      } catch {}
    }
    setMode("done");
  }

  function handleAnswer(choiceIdx: number, remainingMs: number) {
    if (locked) return;
    setLocked(true);
    setSelected(choiceIdx);

    const q = round[qIndex];
    const isCorrect = choiceIdx === q.answer;

    if (isCorrect) {
      const timeBonus = Math.round(
        (Math.max(0, remainingMs) / TIME_PER_QUESTION_MS) * MAX_TIME_BONUS,
      );
      const streakBonus = streak * 10;
      const gained = BASE_POINTS + timeBonus + streakBonus;
      setScore((s) => s + gained);
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

    setTimeout(advance, 900);
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
    setTimeout(advance, 900);
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
        <StartView bestScore={bestScore} onStart={startGame} lang={lang} />
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
          onQuit={goToStart}
          lang={lang}
        />
      )}
      {mode === "done" && (
        <DoneView
          score={score}
          bestScore={bestScore}
          correctCount={correctCount}
          total={round.length}
          bestStreak={bestStreak}
          onPlayAgain={startGame}
          onClose={goToStart}
          lang={lang}
        />
      )}
    </View>
  );
}

function StartView({
  bestScore,
  onStart,
  lang,
}: {
  bestScore: number;
  onStart: () => void;
  lang: Language;
}) {
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

      <View style={styles.statsGrid}>
        <StatCard
          icon="trophy"
          iconColor={C.gold}
          label={t("game_best_score", lang)}
          value={String(bestScore)}
        />
        <StatCard
          icon="help-circle"
          iconColor={C.primary}
          label={t("game_questions", lang)}
          value={String(QUESTIONS_PER_ROUND)}
        />
        <StatCard
          icon="heart"
          iconColor={C.heart}
          label={t("game_hearts", lang)}
          value={String(STARTING_HEARTS)}
        />
        <StatCard
          icon="flash"
          iconColor={C.accent}
          label={t("game_time", lang)}
          value={`${TIME_PER_QUESTION_MS / 1000}s`}
        />
      </View>

      <View style={styles.howCard}>
        <Text style={styles.howTitle}>{t("game_how_title", lang)}</Text>
        <HowRow icon="checkmark-circle" color={C.correct} text={t("game_how_1", lang)} />
        <HowRow icon="flame" color={C.gold} text={t("game_how_2", lang)} />
        <HowRow icon="timer" color={C.primary} text={t("game_how_3", lang)} />
      </View>

      <Pressable onPress={onStart} style={styles.playBtn}>
        <Ionicons name="play" size={20} color="#FFFFFF" />
        <Text style={styles.playBtnText}>{t("game_play", lang)}</Text>
      </Pressable>
    </ScrollView>
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
  lang: Language;
}) {
  const timerAnim = useRef(new Animated.Value(1)).current;
  const startedAt = useRef<number>(Date.now());
  const timeoutFired = useRef(false);

  const shake = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(12)).current;

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
    <View style={styles.playRoot}>
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
        <Text style={styles.questionIndex}>
          {qIndex + 1} / {total}
        </Text>
        <Text style={styles.questionText}>{question.q}</Text>
        {question.ref && (
          <View style={styles.refPill}>
            <Ionicons name="book-outline" size={12} color={C.primary} />
            <Text style={styles.refPillText}>{question.ref}</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.choicesWrap}>
        {question.choices.map((choice, idx) => {
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
    </View>
  );
}

function DoneView({
  score,
  bestScore,
  correctCount,
  total,
  bestStreak,
  onPlayAgain,
  onClose,
  lang,
}: {
  score: number;
  bestScore: number;
  correctCount: number;
  total: number;
  bestStreak: number;
  onPlayAgain: () => void;
  onClose: () => void;
  lang: Language;
}) {
  const isNewBest = score >= bestScore && score > 0;

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
    const pct = correctCount / Math.max(1, total);
    if (pct >= 0.9)
      return { titleKey: "game_result_great" as const, verseKey: "game_verse_great" as const };
    if (pct >= 0.5)
      return { titleKey: "game_result_good" as const, verseKey: "game_verse_good" as const };
    return { titleKey: "game_result_try" as const, verseKey: "game_verse_try" as const };
  }, [correctCount, total]);

  return (
    <ScrollView contentContainerStyle={styles.doneContent}>
      <Animated.View
        style={[styles.doneHero, { opacity, transform: [{ scale }] }]}
      >
        {isNewBest ? (
          <View style={[styles.doneIconCircle, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="trophy" size={44} color={C.gold} />
          </View>
        ) : (
          <View style={styles.doneIconCircle}>
            <Ionicons name="ribbon" size={44} color={C.primary} />
          </View>
        )}
        <Text style={styles.doneTitle}>{t(titleKey, lang)}</Text>
        {isNewBest && (
          <View style={styles.newBestPill}>
            <Ionicons name="sparkles" size={12} color={C.gold} />
            <Text style={styles.newBestPillText}>
              {t("game_new_best", lang)}
            </Text>
          </View>
        )}
        <Text style={styles.doneScore}>{score}</Text>
        <Text style={styles.doneScoreLabel}>{t("game_points", lang)}</Text>
      </Animated.View>

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
          label={t("game_best_score", lang)}
          value={String(bestScore)}
        />
      </View>

      <View style={styles.verseCard}>
        <Ionicons name="book" size={20} color={C.primary} />
        <Text style={styles.verseText}>{t(verseKey, lang)}</Text>
      </View>

      <Pressable onPress={onPlayAgain} style={styles.playBtn}>
        <Ionicons name="refresh" size={18} color="#FFFFFF" />
        <Text style={styles.playBtnText}>{t("game_play_again", lang)}</Text>
      </Pressable>

      <Pressable onPress={onClose} style={styles.secondaryBtn}>
        <Text style={styles.secondaryBtnText}>{t("game_done", lang)}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  startContent: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 48,
    gap: 16,
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
  playBtn: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  playBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  playRoot: { flex: 1, padding: 20, paddingTop: 56, gap: 14 },
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
  questionIndex: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    color: C.primaryDark,
    lineHeight: 28,
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
    paddingBottom: 48,
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
