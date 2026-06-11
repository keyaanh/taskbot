create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'New Chat',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  token_count int,
  quoted_text text,
  created_at timestamptz not null default now()
);

create table if not exists memory_cards (
  id uuid primary key default gen_random_uuid(),
  fact text not null,
  source_chat_id uuid references chats(id) on delete set null,
  is_active bool not null default true,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_id_idx on messages(chat_id);
create index if not exists memory_cards_active_idx on memory_cards(is_active);
