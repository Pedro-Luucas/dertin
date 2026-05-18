const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.error || `Request failed: ${res.status}`;
    console.error(`[API Error] ${options?.method || "GET"} ${path}:`, message);
    throw new Error(message);
  }

  return res.json();
}

export const api = {
  events: {
    getBySlug: (slug: string) =>
      request<{ event: import("@/types/database").Event }>(`/events/${slug}`),

    getCandidates: (slug: string, userId: string) =>
      request<{ candidates: import("@/stores/swipe").SwipeCandidate[] }>(
        `/events/${slug}/users?exclude=${userId}`
      ),
  },

  users: {
    create: (eventSlug: string, data: {
      device_fingerprint: string;
      first_name: string;
      age: number;
      bio?: string;
      gender: string;
      sexuality?: string;
      drink_preference?: string;
      instagram?: string;
      phone_number?: string;
    }) => request<{ user: import("@/types/database").EventUser }>(`/events/${eventSlug}/users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

    getByFingerprint: (eventSlug: string, fingerprint: string) =>
      request<{ user: import("@/types/database").EventUser | null }>(
        `/events/${eventSlug}/users?fingerprint=${fingerprint}`
      ),

    block: (userId: string, blockedId: string) =>
      request<{ success: boolean }>(`/users/${userId}/block`, {
        method: "POST",
        body: JSON.stringify({ blocked_id: blockedId }),
      }),

    report: (userId: string, data: { reported_id: string; event_id: string; reason: string }) =>
      request<{ success: boolean }>(`/users/${userId}/report`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  swipes: {
    create: (data: { event_id: string; swiper_id: string; swiped_id: string; direction: "left" | "right" }) =>
      request<{ match: import("@/types/database").Match | null }>("/swipes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  matches: {
    list: (userId: string, eventId: string) =>
      request<{ matches: import("@/stores/matches").MatchWithUser[] }>(
        `/matches?userId=${userId}&eventId=${eventId}`
      ),

    getMessages: (matchId: string) =>
      request<{ messages: import("@/types/database").ChatMessage[] }>(
        `/matches/${matchId}/messages`
      ),

    sendMessage: (matchId: string, data: { sender_id: string; content: string }) =>
      request<{ message: import("@/types/database").ChatMessage }>(`/matches/${matchId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getOtherUser: (matchId: string, currentUserId: string) =>
      request<{ user: import("@/types/database").EventUser & { photos: import("@/types/database").ProfilePhoto[] } }>(
        `/matches/${matchId}/messages?meta=true&currentUserId=${currentUserId}`
      ),
  },

  upload: {
    photo: async (file: File, eventId: string, userId: string, position: number) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("event_id", eventId);
      formData.append("user_id", userId);
      formData.append("position", String(position));

      const res = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[API Error] POST /upload:", body.error);
        throw new Error(body.error || "Upload failed");
      }

      return res.json() as Promise<{ photo: import("@/types/database").ProfilePhoto }>;
    },
  },

  admin: {
    listEvents: () =>
      request<{ events: import("@/types/database").Event[] }>("/admin/events"),

    createEvent: (data: {
      title: string;
      slug: string;
      venue_name: string;
      starts_at: string;
      ends_at: string;
      cover_image_url?: string | null;
    }) => request<{ event: import("@/types/database").Event }>("/admin/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

    getEvent: (id: string) =>
      request<{
        event: import("@/types/database").Event;
        users: import("@/types/database").EventUser[];
        stats: { users: number; swipes: number; matches: number };
      }>(`/admin/events/${id}`),

    deleteEvent: (id: string) =>
      request<{ success: boolean }>(`/admin/events/${id}`, {
        method: "DELETE",
      }),

    toggleBan: (eventId: string, userId: string, ban: boolean) =>
      request<{ success: boolean }>(`/admin/events/${eventId}/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_banned: ban }),
      }),

    seedEvent: (
      eventId: string,
      options?: {
        count?: number;
        gender?: "mixed" | "male" | "female";
        archetype?: "mixed" | "enthusiastic" | "shy" | "normal";
        with_swipes?: boolean;
      }
    ) => {
      const params = new URLSearchParams();
      if (options?.count) params.set("count", String(options.count));
      if (options?.gender) params.set("gender", options.gender);
      if (options?.archetype) params.set("archetype", options.archetype);
      if (options?.with_swipes) params.set("with_swipes", "true");
      const qs = params.toString();
      return request<{ count: number; photos: number; swipes: number; matches: number }>(
        `/admin/events/${eventId}/seed${qs ? `?${qs}` : ""}`,
        { method: "POST" }
      );
    },

    uploadCover: async (file: File, slug: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "event-covers");
      formData.append("path", `covers/${slug}-${Date.now()}.jpg`);

      const res = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[API Error] POST /upload (cover):", body.error);
        throw new Error(body.error || "Upload failed");
      }

      return res.json() as Promise<{ url: string }>;
    },
  },
};
