"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { MatchWithUser } from "@/stores/matches";

export function MatchesList() {
  const router = useRouter();
  const { currentUser, currentEvent } = useSessionStore();
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRef] = useAutoAnimate();

  async function loadMatches() {
    if (!currentUser || !currentEvent) return;

    try {
      const { matches: data } = await api.matches.list(currentUser.id, currentEvent.id);
      setMatches(data);
      console.log("[MatchesList] Loaded matches:", data.length);
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

  return (
    <div className="flex flex-1 flex-col h-screen-safe safe-top" style={{ overscrollBehavior: "contain" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button
          onClick={() => router.back()}
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
        </div>
      ) : (
        <div ref={listRef} className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => router.push(`/chat/${match.id}`)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 active:bg-secondary/50 transition-colors border-b border-border/50"
            >
              <div className="h-14 w-14 rounded-full overflow-hidden bg-secondary flex-shrink-0 ring-2 ring-purple/20">
                {match.other_user.photos[0] ? (
                  <img
                    src={match.other_user.photos[0].photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xl">👤</div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold truncate">
                  {match.other_user.first_name}, {match.other_user.age}
                </p>
                {match.other_user.instagram && (
                  <p className="text-sm text-purple truncate">
                    @{match.other_user.instagram.replace("@", "")}
                  </p>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground flex-shrink-0">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      )}

      <div className="safe-bottom" />
    </div>
  );
}
