-- Tool-call visibility on assistant messages
-- Run in Supabase SQL editor

alter table messages add column if not exists tool_calls jsonb;
