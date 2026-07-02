-- User preferences (single row per install)
create table if not exists user_preferences (
  id                 uuid    primary key default gen_random_uuid(),
  full_name          text    not null default '',
  preferred_name     text    not null default '',
  instructions       text    not null default '',
  chat_font          text    not null default 'sans',
  notify_on_complete boolean not null default false
);

alter table user_preferences disable row level security;
