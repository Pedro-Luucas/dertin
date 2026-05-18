"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { AnimatePresence, motion } from "framer-motion";
import type { MatchWithUser } from "@/stores/matches";

export function MatchesList() {
  const router = useRouter();
  const { currentUser, currentEvent } = useSessionStore();
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRef] = useAutoAnimate();
  const [viewingProfile, setViewingProfile] = useState<MatchWithUser | null>(null);

  async function loadMatches() {
    if (!currentUser || !currentEvent) return;

    try {
      const { matches: data } = await api.matches.list(currentUser.id, currentEvent.id);
      setMatches(data);
    } catch (err) {
      console.error("[MatchesList] Error loading matches:", err);
      toast.error("Erro ao carregar matches");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!currentUser || !currentEvent) {
      router.push("/");
      return;
    }
    loadMatches();
  }, [currentUser, currentEvent]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-screen-safe">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-purple border-t-transparent" />
      </div>
    );
  }

  const drinkLabels: Record<string, string> = {
    social: "Bebe socialmente",
    never: "Não bebe",
    frequent: "Bebe frequentemente",
  };

  return (
    <div className="flex flex-1 flex-col h-screen-safe safe-top" style={{ overscrollBehavior: "contain" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button
          onClick={() => {
            if (currentEvent) router.push(`/event/${currentEvent.slug}/swipe`);
            else router.back();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Matches</h1>
        <div className="w-7" />
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-purple/10 flex items-center justify-center mb-5">
            <span className="text-4xl">💜</span>
          </div>
          <h2 className="text-lg font-bold">Nenhum match ainda</h2>
          <p className="mt-2 text-sm text-muted-foreground">Continue curtindo — seu match pode estar a um swipe de distância</p>
          <button
            onClick={() => {
              if (currentEvent) router.push(`/event/${currentEvent.slug}/swipe`);
              else router.back();
            }}
            className="mt-6 rounded-2xl bg-purple px-8 py-4 text-white font-semibold hover:bg-purple-dark active:scale-95 transition-all"
          >
            Voltar para swipes
          </button>
        </div>
      ) : (
        <div ref={listRef} className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          {matches.map((match) => (
            <div
              key={match.id}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-border/50"
            >
              {/* Clickable photo → opens profile */}
              <button
                onClick={() => setViewingProfile(match)}
                className="h-14 w-14 rounded-full overflow-hidden bg-secondary flex-shrink-0 ring-2 ring-purple/20 active:scale-95 transition-transform"
              >
                {match.other_user.photos[0] ? (
                  <img
                    src={match.other_user.photos[0].photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xl">👤</div>
                )}
              </button>

              {/* Info + chat navigation */}
              <button
                onClick={() => router.push(`/chat/${match.id}`)}
                className="flex-1 text-left min-w-0 hover:opacity-80 transition-opacity"
              >
                <p className="font-semibold truncate">
                  {match.other_user.first_name}, {match.other_user.age}
                </p>
                {match.other_user.instagram && (
                  <a
                    href={`https://instagram.com/${match.other_user.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-purple hover:underline truncate block"
                  >
                    @{match.other_user.instagram.replace("@", "")}
                  </a>
                )}
              </button>

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-muted-foreground flex-shrink-0"
                onClick={() => router.push(`/chat/${match.id}`)}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))}
        </div>
      )}

      <div className="safe-bottom" />

      {/* Profile detail overlay */}
      <AnimatePresence>
        {viewingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
            onClick={() => setViewingProfile(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 overflow-y-auto overscroll-contain"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setViewingProfile(null)}
                className="sticky top-4 left-4 z-10 h-10 w-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center ml-4"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Photos */}
              <div className="px-4 -mt-6 space-y-3">
                {viewingProfile.other_user.photos.length > 0 ? (
                  viewingProfile.other_user.photos.map((photo, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt={`${viewingProfile.other_user.first_name} foto ${i + 1}`}
                        className="w-full aspect-[3/4] object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-secondary aspect-[3/4] flex items-center justify-center">
                    <span className="text-5xl opacity-50">📷</span>
                  </div>
                )}
              </div>

              {/* Profile info */}
              <div className="px-5 pt-6 pb-32">
                <h2 className="text-3xl font-bold text-foreground">
                  {viewingProfile.other_user.first_name}
                  <span className="font-normal text-muted-foreground ml-2">
                    {viewingProfile.other_user.age}
                  </span>
                </h2>

                {viewingProfile.other_user.bio && (
                  <p className="mt-4 text-[0.95rem] text-muted-foreground leading-relaxed">
                    {viewingProfile.other_user.bio}
                  </p>
                )}

                {/* Details */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {viewingProfile.other_user.gender && (
                    <span className="px-3 py-1.5 rounded-full bg-purple/10 text-purple text-sm font-medium">
                      {viewingProfile.other_user.gender === "male" ? "Homem" : viewingProfile.other_user.gender === "female" ? "Mulher" : viewingProfile.other_user.gender}
                    </span>
                  )}
                  {viewingProfile.other_user.drink_preference && (
                    <span className="px-3 py-1.5 rounded-full bg-purple/10 text-purple text-sm font-medium">
                      {drinkLabels[viewingProfile.other_user.drink_preference] || viewingProfile.other_user.drink_preference}
                    </span>
                  )}
                </div>

                {/* Instagram link */}
                {viewingProfile.other_user.instagram && (
                  <a
                    href={`https://instagram.com/${viewingProfile.other_user.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex items-center gap-2 text-purple font-medium hover:underline"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    @{viewingProfile.other_user.instagram.replace("@", "")}
                  </a>
                )}

                {/* Go to chat */}
                <button
                  onClick={() => {
                    setViewingProfile(null);
                    router.push(`/chat/${viewingProfile.id}`);
                  }}
                  className="mt-8 w-full rounded-2xl bg-purple py-4 text-white font-semibold hover:bg-purple-dark active:scale-[0.98] transition-all"
                >
                  Enviar mensagem
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
