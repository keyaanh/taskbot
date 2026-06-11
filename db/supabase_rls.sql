-- Disable RLS on all three tables (backend-only app, no user auth needed)
alter table chats disable row level security;
alter table messages disable row level security;
alter table memory_cards disable row level security;
