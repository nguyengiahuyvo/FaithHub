// Shared types + helpers for Verse Quest community questions and the
// org leaderboard. Used by both the game screen and the dedicated
// quest-questions management page.

import {
  doc,
  increment,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Language } from "./i18n";

// Per the rules:
//   +5 points per correct answer
//   +2 points per question authored
export const POINTS_PER_QUESTION_CREATED = 2;

export type QuestionTranslation = {
  q: string;
  choices: string[];
  successMsg?: string;
  failMsg?: string;
};

export type Question = {
  q: string;
  choices: string[];
  answer: number;
  ref?: string;
  language?: Language;
  // Per-language translations (keyed by Language code).
  translations?: Partial<Record<Language, QuestionTranslation>>;
  id?: string;
  createdBy?: string;
  createdByName?: string | null;
  successMsg?: string;
  failMsg?: string;
};

/**
 * Resolve the display content of a question for a given language.
 * Falls back to the primary fields if no translation exists.
 */
export function resolveTranslation(
  q: Question,
  lang: Language,
): { q: string; choices: string[]; successMsg?: string; failMsg?: string } {
  const t = q.translations?.[lang];
  if (t && t.q && t.choices?.length === q.choices.length) return t;
  return { q: q.q, choices: q.choices, successMsg: q.successMsg, failMsg: q.failMsg };
}

/**
 * List language codes that have a valid translation for a question.
 */
export function availableLanguages(q: Question): Language[] {
  const langs: Language[] = [];
  const primary = q.language || "en";
  if (q.q) langs.push(primary as Language);
  for (const l of ["en", "de", "vi"] as Language[]) {
    if (l === primary) continue;
    const t = q.translations?.[l];
    if (t && t.q && t.choices?.length === q.choices.length) langs.push(l);
  }
  return langs;
}

export type CommunityQuestion = Question & {
  id: string;
  createdBy: string;
  createdByName: string | null;
};

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
  } catch {
    // best-effort — don't break the caller's flow
  }
}
