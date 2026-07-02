-- API key management table
-- Run in Supabase SQL editor

create table if not exists api_keys (
  id                 uuid        primary key default gen_random_uuid(),
  provider           text        not null unique,          -- 'anthropic' | 'openai' | 'google'
  key_preview        text        not null,                 -- last 6 chars only, for display
  encrypted_key      text        not null,                 -- Fernet-encrypted, never returned raw
  is_valid           boolean     not null default false,
  last_validated_at  timestamptz,
  created_at         timestamptz not null default now()
);
