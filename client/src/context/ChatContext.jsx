import { createContext, useContext, useState, useCallback, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const Ctx = createContext(null);

export function ChatProvider({ children }) {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [memory, setMemory] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const activeIdRef = useRef(null);

  const loadChats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/chats/list`);
      const d = await r.json();
      setChats(Array.isArray(d) ? d : []);
    } catch {}
  }, []);

  const loadMessages = useCallback(async (id) => {
    try {
      const r = await fetch(`${API}/chats/${id}/messages`);
      const d = await r.json();
setMessages(Array.isArray(d) ? d : []);
      setActiveId(id);
      activeIdRef.current = id;
    } catch {}
  }, []);

  const loadMemory = useCallback(async () => {
    try {
      const r = await fetch(`${API}/memory`);
      const d = await r.json();
      setMemory(Array.isArray(d) ? d : []);
    } catch {}
  }, []);

  // Resets UI to a blank slate — does NOT create a DB record yet.
  // The record is created lazily on first send (see sendMessage below).
  const newChat = useCallback(() => {
    setMessages([]);
    setActiveId(null);
    activeIdRef.current = null;
  }, []);

  const deleteChat = useCallback(async (id) => {
    await fetch(`${API}/chats/${id}`, { method: 'DELETE' });
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeIdRef.current === id) {
      setActiveId(null); activeIdRef.current = null;
      setMessages([]);
    }
  }, []);

  const deleteMemory = useCallback(async (id) => {
    await fetch(`${API}/memory/${id}`, { method: 'DELETE' });
    setMemory(prev => prev.filter(m => m.id !== id));
  }, []);

  const sendMessage = useCallback(async (content, quoted_text, currentMessages, fileData, mode, model) => {
    setError(null);

    const uid = `u-${Date.now()}`;
    const aid = `a-${Date.now() + 1}`;

    try {
      // Lazy chat creation — generate the id client-side and let the backend
      // insert the row only after a real exchange completes (chat.py:
      // send_message only inserts once full_content is non-empty). No
      // network round trip up front means no empty row can ever be created
      // by opening a new chat and not finishing it.
      let cid = activeIdRef.current;
      const isNewChat = !cid;
      if (isNewChat) {
        cid = crypto.randomUUID();
        setActiveId(cid);
        activeIdRef.current = cid;
      }

      const userMsg = {
        id: uid, role: 'user', content,
        quoted_text: quoted_text || null,
        file_name: fileData?.name || null,
        _fileData: fileData || null,
        created_at: new Date().toISOString(),
      };
      const aiMsg = { id: aid, role: 'assistant', content: '', created_at: new Date().toISOString() };

      setMessages(prev => [...prev, userMsg, aiMsg]);
      setStreaming(true);

      // history is plain text — document context is stored in DB and injected server-side
      const history = (currentMessages || [])
        .filter(m => m.content?.trim())
        .map(m => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(`${API}/chats/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          content,
          chat_id: cid,
          quoted_text: quoted_text || undefined,
          file: fileData || undefined,
          mode:  mode  || undefined,
          model: model || undefined,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(await resp.text() || `Server error ${resp.status}`);

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let full = '', buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          let p; try { p = JSON.parse(raw); } catch { continue; }
          if (p?.error) throw new Error(p.error);
          if (p?.thinking) {
            setMessages(prev => prev.map(m => m.id === aid ? { ...m, thinking: p.thinking } : m));
          }
          if (p?.text) {
            full += p.text;
            setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: full } : m));
          }
          if (p?.sources) {
            setMessages(prev => prev.map(m => m.id === aid ? { ...m, sources: p.sources } : m));
          }
          if (p?.tool_call) {
            setMessages(prev => prev.map(m => m.id === aid
              ? { ...m, tool_calls: [...(m.tool_calls || []), p.tool_call] }
              : m));
          }
          if (p?.tool_result) {
            setMessages(prev => prev.map(m => m.id === aid
              ? { ...m, tool_calls: (m.tool_calls || []).map(c =>
                  (c.name === p.tool_result.name && c.result === undefined) ? { ...c, result: p.tool_result.result } : c) }
              : m));
          }
        }
      }

      // Only now — after the model actually replied (full non-empty) — does
      // the chat row exist server-side (chat.py's lazy insert requires
      // full_content). Mirror that in the sidebar: no reply, no entry.
      if (full) {
        const title = (content || fileData?.name || 'File').slice(0, 45) || 'New Chat';
        if (isNewChat) {
          setChats(prev => [{ id: cid, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev]);
        } else {
          setChats(prev => prev.map(c => c.id === cid ? { ...c, title } : c));
        }
      }
      fetch(`${API}/chats/${cid}/title`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: (content || fileData?.name || 'File').slice(0, 45) }),
      }).catch(() => {});
      fetch(`${API}/memory/extract`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cid }),
      }).then(() => loadMemory()).catch(() => {});

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setMessages(prev => prev.filter(m => m.id !== aid));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [loadMemory]);

  const stopStreaming = useCallback(() => { abortRef.current?.abort(); setStreaming(false); }, []);

  const getSummary = useCallback(async (id) => {
    const r = await fetch(`${API}/chats/${id}/summary`);
    return (await r.json()).summary;
  }, []);

  const exportChat = useCallback((id) => {
    const chat = chats.find(c => c.id === id);
    let md = `# ${chat?.title || 'Chat'}\n_${new Date().toLocaleDateString()}_\n\n`;
    md += messages.map(m => `**${m.role}** _(${new Date(m.created_at).toLocaleTimeString()})_\n\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${chat?.title || 'chat'}.md`; a.click();
  }, [chats, messages]);

  return (
    <Ctx.Provider value={{ chats, activeId, messages, setMessages, memory, streaming, error, loadChats, loadMessages, loadMemory, newChat, deleteChat, deleteMemory, sendMessage, stopStreaming, getSummary, exportChat }}>
      {children}
    </Ctx.Provider>
  );
}

export const useChat = () => useContext(Ctx);
