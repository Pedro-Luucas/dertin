import { create } from "zustand";
import type { EventUser, ProfilePhoto } from "@/types/database";

export interface SwipeCandidate extends EventUser {
  photos: ProfilePhoto[];
}

interface SwipeState {
  candidates: SwipeCandidate[];
  currentIndex: number;
  setCandidates: (candidates: SwipeCandidate[]) => void;
  nextCandidate: () => void;
  reset: () => void;
}

export const useSwipeStore = create<SwipeState>((set) => ({
  candidates: [],
  currentIndex: 0,
  setCandidates: (candidates) => set({ candidates, currentIndex: 0 }),
  nextCandidate: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  reset: () => set({ candidates: [], currentIndex: 0 }),
}));
