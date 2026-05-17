"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSessionStore } from "@/stores/session";
import { api } from "@/lib/api-client";
import { generateFingerprint } from "@/lib/fingerprint";
import type { Event } from "@/types/database";

interface Props {
  event: Event;
}

export function EventLanding({ event }: Props) {
  const router = useRouter();
  const { setCurrentEvent, setCurrentUser } = useSessionStore();

  async function checkExistingUser() {
    try {
      const fp = generateFingerprint();
      const { user } = await api.users.getByFingerprint(event.slug, fp);
      if (user) {
        setCurrentUser(user);
        router.push(`/event/${event.slug}/swipe`);
      }
    } catch (err) {
      console.error("[EventLanding] Error checking existing user:", err);
    }
  }

  useEffect(() => {
    setCurrentEvent(event);
  }, [event, setCurrentEvent]);

  useEffect(() => {
    checkExistingUser();
  }, [event]);

  return (
    <div className="flex flex-1 flex-col h-screen-safe">
      {/* Cover image */}
      {event.cover_image_url && (
        <div className="relative h-[45%] w-full overflow-hidden">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center -mt-8 relative z-10">
        {!event.cover_image_url && (
          <div className="w-16 h-16 rounded-full bg-purple/10 flex items-center justify-center mb-5">
            <span className="text-3xl">🎉</span>
          </div>
        )}

        <h1 className="text-3xl font-black tracking-tight">{event.title}</h1>
        <p className="mt-2 text-muted-foreground font-medium">{event.venue_name}</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          {new Date(event.starts_at).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <button
          onClick={() => router.push(`/event/${event.slug}/onboarding`)}
          className="mt-8 w-full max-w-sm rounded-2xl bg-purple py-5 text-white text-lg font-bold hover:bg-purple-dark active:scale-[0.98] transition-all shadow-lg shadow-purple/20"
        >
          Entrar no evento
        </button>
      </div>

      <div className="safe-bottom" />
    </div>
  );
}
