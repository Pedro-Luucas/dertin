-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Events table
create table events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  cover_image_url text,
  venue_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

create index idx_events_slug on events(slug);
create index idx_events_active on events(is_active) where is_active = true;

-- Event users (profiles scoped to an event)
create table event_users (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  device_fingerprint text not null,
  first_name text not null,
  age integer not null check (age >= 18),
  bio text,
  gender text not null,
  sexuality text,
  drink_preference text,
  instagram text,
  phone_number text,
  is_online boolean not null default false,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  is_banned boolean not null default false,
  constraint unique_user_per_event unique (event_id, device_fingerprint)
);

create index idx_event_users_event on event_users(event_id);
create index idx_event_users_fingerprint on event_users(device_fingerprint);

-- Profile photos
create table profile_photos (
  id uuid primary key default uuid_generate_v4(),
  event_user_id uuid not null references event_users(id) on delete cascade,
  photo_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_profile_photos_user on profile_photos(event_user_id);

-- Swipes
create table swipes (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  swiper_id uuid not null references event_users(id) on delete cascade,
  swiped_id uuid not null references event_users(id) on delete cascade,
  direction text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default now(),
  constraint unique_swipe unique (swiper_id, swiped_id)
);

create index idx_swipes_event on swipes(event_id);
create index idx_swipes_swiper on swipes(swiper_id);
create index idx_swipes_swiped on swipes(swiped_id);

-- Matches
create table matches (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  user_a_id uuid not null references event_users(id) on delete cascade,
  user_b_id uuid not null references event_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_match unique (user_a_id, user_b_id)
);

create index idx_matches_event on matches(event_id);
create index idx_matches_user_a on matches(user_a_id);
create index idx_matches_user_b on matches(user_b_id);

-- Chat messages
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references event_users(id) on delete cascade,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

create index idx_chat_messages_match on chat_messages(match_id);

-- Reports
create table reports (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  reporter_id uuid not null references event_users(id) on delete cascade,
  reported_id uuid not null references event_users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Blocked users
create table blocked_users (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references event_users(id) on delete cascade,
  blocked_id uuid not null references event_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_block unique (blocker_id, blocked_id)
);

-- Admin users (simple table for admin auth)
create table admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);
