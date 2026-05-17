export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          cover_image_url: string | null;
          venue_name: string;
          starts_at: string;
          ends_at: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          cover_image_url?: string | null;
          venue_name: string;
          starts_at: string;
          ends_at: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          cover_image_url?: string | null;
          venue_name?: string;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      event_users: {
        Row: {
          id: string;
          event_id: string;
          device_fingerprint: string;
          first_name: string;
          age: number;
          bio: string | null;
          gender: string;
          sexuality: string | null;
          drink_preference: string | null;
          instagram: string | null;
          phone_number: string | null;
          is_online: boolean;
          last_active_at: string;
          created_at: string;
          is_banned: boolean;
        };
        Insert: {
          id?: string;
          event_id: string;
          device_fingerprint: string;
          first_name: string;
          age: number;
          bio?: string | null;
          gender: string;
          sexuality?: string | null;
          drink_preference?: string | null;
          instagram?: string | null;
          phone_number?: string | null;
          is_online?: boolean;
          last_active_at?: string;
          created_at?: string;
          is_banned?: boolean;
        };
        Update: {
          id?: string;
          event_id?: string;
          device_fingerprint?: string;
          first_name?: string;
          age?: number;
          bio?: string | null;
          gender?: string;
          sexuality?: string | null;
          drink_preference?: string | null;
          instagram?: string | null;
          phone_number?: string | null;
          is_online?: boolean;
          last_active_at?: string;
          is_banned?: boolean;
        };
        Relationships: [];
      };
      profile_photos: {
        Row: {
          id: string;
          event_user_id: string;
          photo_url: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_user_id: string;
          photo_url: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_user_id?: string;
          photo_url?: string;
          position?: number;
        };
        Relationships: [];
      };
      swipes: {
        Row: {
          id: string;
          event_id: string;
          swiper_id: string;
          swiped_id: string;
          direction: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          swiper_id: string;
          swiped_id: string;
          direction: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          swiper_id?: string;
          swiped_id?: string;
          direction?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          event_id: string;
          user_a_id: string;
          user_b_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_a_id: string;
          user_b_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_a_id?: string;
          user_b_id?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          content?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          event_id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          reporter_id?: string;
          reported_id?: string;
          reason?: string;
        };
        Relationships: [];
      };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventUser = Database["public"]["Tables"]["event_users"]["Row"];
export type ProfilePhoto = Database["public"]["Tables"]["profile_photos"]["Row"];
export type Swipe = Database["public"]["Tables"]["swipes"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type BlockedUser = Database["public"]["Tables"]["blocked_users"]["Row"];
