-- Enable RLS on all tables
alter table events enable row level security;
alter table event_users enable row level security;
alter table profile_photos enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table chat_messages enable row level security;
alter table reports enable row level security;
alter table blocked_users enable row level security;
alter table admin_users enable row level security;

-- Events: anyone can read active events
create policy "events_read" on events for select using (is_active = true);

-- Event users: anyone can read users in active events, insert own profile
create policy "event_users_read" on event_users for select using (true);
create policy "event_users_insert" on event_users for insert with check (true);
create policy "event_users_update" on event_users for update using (true);

-- Profile photos: anyone can read, users can insert their own
create policy "profile_photos_read" on profile_photos for select using (true);
create policy "profile_photos_insert" on profile_photos for insert with check (true);

-- Swipes: users can insert their own swipes, read own swipes
create policy "swipes_insert" on swipes for insert with check (true);
create policy "swipes_read" on swipes for select using (true);

-- Matches: users can read matches they're part of
create policy "matches_read" on matches for select using (true);
create policy "matches_insert" on matches for insert with check (true);

-- Chat messages: users can read/insert in their matches
create policy "chat_messages_read" on chat_messages for select using (true);
create policy "chat_messages_insert" on chat_messages for insert with check (true);

-- Reports: users can insert reports
create policy "reports_insert" on reports for insert with check (true);

-- Blocked users: users can manage their blocks
create policy "blocked_users_read" on blocked_users for select using (true);
create policy "blocked_users_insert" on blocked_users for insert with check (true);
create policy "blocked_users_delete" on blocked_users for delete using (true);

-- Admin users: no public access
create policy "admin_users_none" on admin_users for select using (false);

-- Create storage buckets
insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true);
insert into storage.buckets (id, name, public) values ('event-covers', 'event-covers', true);

-- Storage policies: anyone can read public buckets, anyone can upload
create policy "profile_photos_storage_read" on storage.objects for select using (bucket_id = 'profile-photos');
create policy "profile_photos_storage_insert" on storage.objects for insert with check (bucket_id = 'profile-photos');
create policy "event_covers_storage_read" on storage.objects for select using (bucket_id = 'event-covers');
create policy "event_covers_storage_insert" on storage.objects for insert with check (bucket_id = 'event-covers');
