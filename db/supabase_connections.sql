-- OAuth connections for pre-built integrations
-- Run in Supabase SQL editor

create table if not exists mcp_connections (
  id            uuid        primary key default gen_random_uuid(),
  provider      text        not null unique,   -- 'google_calendar', 'gmail', 'notion', 'slack'
  access_token  text        not null,          -- Fernet-encrypted
  refresh_token text,                          -- Fernet-encrypted, nullable
  expires_at    timestamptz,
  scope         text,                          -- space-separated granted scopes
  connected_at  timestamptz not null default now(),
  status        text        not null default 'connected'  -- connected | expired | error
);

-- Tokens are server-side encrypted; disable RLS so the backend can read/write freely
alter table mcp_connections disable row level security;
