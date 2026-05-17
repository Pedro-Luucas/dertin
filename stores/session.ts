import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Event, EventUser } from "@/types/database";

interface SessionState {
  currentEvent: Event | null;
  currentUser: EventUser | null;
  setCurrentEvent: (event: Event | null) => void;
  setCurrentUser: (user: EventUser | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentEvent: null,
      currentUser: null,
      setCurrentEvent: (event) => set({ currentEvent: event }),
      setCurrentUser: (user) => set({ currentUser: user }),
      clear: () => set({ currentEvent: null, currentUser: null }),
    }),
    { name: "dertin_session" }
  )
);
