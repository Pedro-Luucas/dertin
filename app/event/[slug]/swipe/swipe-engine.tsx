"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session";
import { useSwipeStore, type SwipeCandidate } from "@/stores/swipe";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { SwipeCard } from "./swipe-card";

export function SwipeEngine() {
  const router = useRouter();
  const { currentEvent, currentUser } = useSessionStore();
  const { candidates, currentIndex, setCandidates, nextCandidate } = useSwipeStore();
  const [matchPopup, setMatchPopup] = useState<SwipeCandidate | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadCandidates() {
    if (!currentEvent || !currentUser) return;

    try {
      const { candidates: data } = await api.events.getCandidates(
        currentEvent.slug,
        currentUser.id
      );
      setCandidates(data);
      console.log("[SwipeEngine] Loaded candidates:", data.length);
    } catch (err) {
      console.error("[SwipeEngine] Error loading candidates:", err);
      toast.error("Erro ao carregar perfis");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!currentEvent || !currentUser) {
      router.push("/");
      return;
    }
    loadCandidates();
  }, [currentEvent, currentUser]);

  async function handleSwipe(direction: "left" | "right") {
    if (!currentEvent || !currentUser) return;
    const candidate = candidates[currentIndex];
    if (!candidate) return;

    try {
      const { match } = await api.swipes.create({
        event_id: currentEvent.id,
        swiper_id: currentUser.id,
        swiped_id: candidate.id,
        direction,
      });

      if (match) {
        console.log("[SwipeEngine] Match created:", match.id);
        setMatchPopup(candidate);
      }
    } catch (err) {
      console.error("[SwipeEngine] Swipe error:", err);
    }

    nextCandidate();
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-screen-safe">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-purple border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando perfis...</p>
        </div>
      </div>
    );
  }

  const current = candidates[currentIndex];

  if (!current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center h-screen-safe">
        <div className="w-20 h-20 rounded-full bg-purple/10 flex items-center justify-center mb-5">
          <span className="text-4xl">👀</span>
        </div>
        <h2 className="text-xl font-bold">Acabou por enquanto</h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          Volte mais tarde — novas pessoas podem aparecer a qualquer momento
        </p>
        <button
          onClick={() => router.push("/matches")}
          className="mt-8 rounded-2xl bg-purple px-8 py-4 text-white font-semibold hover:bg-purple-dark active:scale-95 transition-all"
        >
          Ver seus matches
        </button>
        <button
          onClick={() => {
            useSwipeStore.getState().reset();
            setLoading(true);
            loadCandidates();
          }}
          className="mt-3 rounded-2xl bg-secondary px-8 py-4 text-foreground font-medium active:scale-95 transition-all text-sm"
        >
          Resetar (dev)
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-screen-safe safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-2xl font-black tracking-tight text-purple">dertin</h1>
        <button
          onClick={() => router.push("/matches")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-purple transition-colors px-3 py-2 rounded-full hover:bg-purple/5"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-purple">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          Matches
        </button>
      </div>

      {/* Swipe area */}
      <div className="flex flex-1 items-center justify-center px-4 pb-4">
        <SwipeCard key={current.id} candidate={current} onSwipe={handleSwipe} />
      </div>

      {/* Match drawer */}
      <Drawer open={!!matchPopup} onOpenChange={(open) => !open && setMatchPopup(null)}>
        <DrawerContent className="bg-background border-border">
          <div className="flex flex-col items-center px-6 pb-8 pt-4">
            <DrawerTitle className="sr-only">Match!</DrawerTitle>
            <div className="w-20 h-20 rounded-full bg-purple/20 flex items-center justify-center mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-3xl font-black text-purple">Match!</h2>
            <p className="mt-2 text-muted-foreground text-center">
              Você e <span className="text-foreground font-medium">{matchPopup?.first_name}</span> se curtiram
            </p>

            {matchPopup?.photos[0] && (
              <div className="mt-5 h-24 w-24 rounded-full overflow-hidden ring-4 ring-purple/30">
                <img
                  src={matchPopup.photos[0].photo_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mt-6 w-full space-y-3">
              <button
                onClick={() => {
                  setMatchPopup(null);
                  router.push("/matches");
                }}
                className="w-full rounded-2xl bg-purple py-4 text-white font-semibold hover:bg-purple-dark active:scale-[0.98] transition-all"
              >
                Ver matches
              </button>
              <button
                onClick={() => setMatchPopup(null)}
                className="w-full rounded-2xl bg-secondary py-4 text-foreground font-medium active:scale-[0.98] transition-all"
              >
                Continuar curtindo
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
