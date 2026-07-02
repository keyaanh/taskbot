-- Task 2 migration
-- Run this in the Supabase SQL editor

-- Sources on assistant messages (JSONB array of {title,url,page_age,retrieved_at})
alter table messages add column if not exists sources jsonb;

-- Running conversation summary per chat
alter table chats add column if not exists context_summary text;

-- How many messages from history are already compressed into context_summary
-- Used to decide when to re-summarize (every 4 new messages past the window)
alter table chats add column if not exists summary_msg_count int not null default 0;
