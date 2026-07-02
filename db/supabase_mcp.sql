-- MCP server registry
-- Run in Supabase SQL editor

create table if not exists mcp_servers (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  url         text        not null unique,
  is_enabled  boolean     not null default true,
  tools       jsonb,          -- cached [{name, description, inputSchema}]
  last_synced timestamptz,
  created_at  timestamptz not null default now()
);
