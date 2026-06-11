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

  const newChat = useCallback(async () => {
    const r = await fetch(`${API}/chats/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    if (!r.ok) throw new Error(`Failed to create chat: ${r.status}`);
    const chat = await r.json();
    if (!chat?.id) throw new Error('Invalid chat response');
    setChats(prev => [chat, ...prev]);
    setMessages([]);
    setActiveId(chat.id);
    activeIdRef.current = chat.id;
    return chat.id;
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

  const sendMessage = useCallback(async (content, quoted_text, currentMessages, fileData, mode) => {
    setError(null);

    const uid = `u-${Date.now()}`;
    const aid = `a-${Date.now() + 1}`;

    const userMsg = {
      id: uid, role: 'user', content,
      quoted_text: quoted_text || null,
      file_name: fileData?.name || null,
      _fileData: fileData || null,   // kept in memory for follow-up messages
      created_at: new Date().toISOString(),
    };
    const aiMsg = { id: aid, role: 'assistant', content: '', created_at: new Date().toISOString() };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setStreaming(true);

    try {
      let cid = activeIdRef.current;
      if (!cid) cid = await newChat();

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
          mode: mode || undefined,
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
        }
      }

      setChats(prev => prev.map(c =>
        c.id === cid && c.title === 'New Chat' ? { ...c, title: content.slice(0, 45) || (fileData?.name || 'File') } : c
      ));
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
  }, [newChat, loadMemory]);

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
    <Ctx.Provider value={{ chats, activeId, messages, memory, streaming, error, loadChats, loadMessages, loadMemory, newChat, deleteChat, deleteMemory, sendMessage, stopStreaming, getSummary, exportChat }}>
      {children}
    </Ctx.Provider>
  );
}

export const useChat = () => useContext(Ctx);
