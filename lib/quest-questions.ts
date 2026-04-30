// Shared types + helpers for Verse Quest questions and the org leaderboard.

import {
  doc,
  increment,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Language } from "./i18n";

const ALL_LANGS: Language[] = ["en", "de", "vi"];

export type QuestionTranslation = {
  q: string;
  choices: string[];
  successMsg?: string;
  failMsg?: string;
};

export type Question = {
  id?: string;
  answer: number;
  reference?: Partial<Record<Language, string>>;
  translations: Partial<Record<Language, QuestionTranslation>>;
  answeredUsers?: Record<string, boolean>;
};

export type CommunityQuestion = Question & { id: string };

function isValidTranslation(t: QuestionTranslation | undefined): t is QuestionTranslation {
  if (!t) return false;
  if (typeof t.q !== "string" || !t.q.trim()) return false;
  if (!Array.isArray(t.choices) || t.choices.length === 0) return false;
  return t.choices.every((c) => typeof c === "string" && c.trim().length > 0);
}

/**
 * Resolve the display content of a question for a given language.
 * Falls back to the first available translation if the requested
 * language has no entry.
 */
export function resolveTranslation(
  q: Question,
  lang: Language,
): QuestionTranslation {
  const requested = q.translations?.[lang];
  if (isValidTranslation(requested)) return requested;
  for (const l of ALL_LANGS) {
    const t = q.translations?.[l];
    if (isValidTranslation(t)) return t;
  }
  return { q: "", choices: [] };
}

/**
 * Resolve the localized scripture reference for a question.
 * Falls back to the first available reference if the requested language
 * has no entry. Returns undefined when no reference is set.
 */
export function resolveReference(
  q: Question,
  lang: Language,
): string | undefined {
  const requested = q.reference?.[lang];
  if (typeof requested === "string" && requested.trim()) return requested;
  for (const l of ALL_LANGS) {
    const r = q.reference?.[l];
    if (typeof r === "string" && r.trim()) return r;
  }
  return undefined;
}

/**
 * List language codes that have a valid translation for a question.
 */
export function availableLanguages(q: Question): Language[] {
  const langs: Language[] = [];
  for (const l of ALL_LANGS) {
    if (isValidTranslation(q.translations?.[l])) langs.push(l);
  }
  return langs;
}

/**
 * Increment a player's Shekel balance on their org member document.
 * Best-effort — never throws so callers can fire-and-forget.
 */
export async function addToLeaderboard(
  orgId: string | undefined,
  uid: string | undefined,
  _displayName: string | null,
  delta: number,
): Promise<void> {
  if (!orgId || !uid || delta === 0) return;
  try {
    await setDoc(
      doc(db, "organizations", orgId, "members", uid),
      { shekel: increment(delta) },
      { merge: true },
    );
  } catch (e) {
    console.error("addToLeaderboard failed:", e);
  }
}
