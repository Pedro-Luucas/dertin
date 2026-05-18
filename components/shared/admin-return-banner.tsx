"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/session";

/**
 * Floating banner shown when an organizer is previewing the event as a participant.
 * Lets them jump back to the admin dashboard for the corresponding event.
 *
 * Hidden on /admin/* routes and on the public landing page so we don't leak the
 * organizer affordance to real attendees.
 */
export function AdminReturnBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const adminReturnEventId = useSessionStore((s) => s.adminReturnEventId);
  const setAdminReturnEventId = useSessionStore((s) => s.setAdminReturnEventId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!adminReturnEventId) return null;
  if (pathname?.startsWith("/admin")) return null;

  function handleReturn() {
    setAdminReturnEventId(null);
    router.push(`/admin/events/${adminReturnEventId}`);
  }

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        type="button"
        onClick={handleReturn}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-purple/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple/30 ring-1 ring-white/20 hover:bg-purple active:scale-[0.97] transition-all"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Pré-visualização do organizador · Voltar ao painel</span>
      </button>
    </div>
  );
}
