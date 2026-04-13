// Shared types + helpers for Verse Quest community questions and the
// org leaderboard. Used by both the game screen and the dedicated
// quest-questions management page.

import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Language } from "./i18n";

// Per the rules:
//   +5 points per correct answer
//   +2 points per question authored
export const POINTS_PER_QUESTION_CREATED = 2;

export type Question = {
  q: string;
  choices: string[];
  answer: number;
  ref?: string;
  // Language the question was authored in — used to filter the pool
  // so players answer questions in a language they understand.
  language?: Language;
  // Community-authored question metadata (undefined for legacy/built-in questions).
  id?: string;
  createdBy?: string;
  createdByName?: string | null;
  // Optional trash-talk shown after the answer is revealed.
  successMsg?: string;
  failMsg?: string;
};

export type CommunityQuestion = Question & {
  id: string;
  createdBy: string;
  createdByName: string | null;
};

/**
 * Increment a player's running total in the org leaderboard. Best-effort —
 * never throws so callers can fire-and-forget.
 */
export async function addToLeaderboard(
  orgId: string | undefined,
  uid: string | undefined,
  displayName: string | null,
  delta: number,
): Promise<void> {
  if (!orgId || !uid || delta === 0) return;
  try {
    await setDoc(
      doc(db, "organizations", orgId, "questScores", uid),
      {
        score: increment(delta),
        displayName: displayName ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // best-effort — don't break the caller's flow
  }
}
