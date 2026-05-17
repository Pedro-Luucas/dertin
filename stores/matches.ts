import { create } from "zustand";
import type { Match, EventUser, ProfilePhoto } from "@/types/database";

export interface MatchWithUser extends Match {
  other_user: EventUser & { photos: ProfilePhoto[] };
}

interface MatchesState {
  matches: MatchWithUser[];
  setMatches: (matches: MatchWithUser[]) => void;
  addMatch: (match: MatchWithUser) => void;
}

export const useMatchesStore = create<MatchesState>((set) => ({
  matches: [],
  setMatches: (matches) => set({ matches }),
  addMatch: (match) => set((s) => ({ matches: [match, ...s.matches] })),
}));
