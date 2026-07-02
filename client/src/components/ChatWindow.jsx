import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import { PromptInputBox } from './ui/ai-prompt-box';
import useVoice from '../hooks/useVoice';
import { PenLine, Lightbulb, Search, BarChart2 } from 'lucide-react';
import TaskbotIcon from './TaskbotIcon';

const PILLS = [
  { label: 'Help me write', icon: PenLine },
  { label: 'Explain a concept', icon: Lightbulb },
  { label: 'Search something', icon: Search },
];

function AIAvatar({ loading }) {
  return (
    <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
      {loading && (
        <>
          <div style={{ position: 'absolute', inset: -4, borderRadius: 12, border: '1.5px solid var(--gold)', opacity: 0, animation: 'avatarPulse 1.6s ease-out infinite' }} />
          <div style={{ position: 'absolute', inset: -4, borderRadius: 12, border: '1.5px solid var(--gold)', opacity: 0, animation: 'avatarPulse 1.6s ease-out infinite 0.6s' }} />
        </>
      )}
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
        <TaskbotIcon size={13} color="var(--text-sub)" />
      </div>
    </div>
  );
}

export default function ChatWindow() {
  const { messages, streaming, error, sendMessage, stopStreaming, setMessages } = useChat();
  const [quote, setQuote] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const bottom = useRef(null);
  const messagesRef = useRef(messages);
  const { levels } = useVoice();

  // If messages already exist on load, skip welcome state
  const [phase, setPhase] = useState(() => messages.length > 0 ? 'chat' : 'welcome');
  const prevLen = useRef(messages.length);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const prev = prevLen.current;
    const curr = messages.length;

    if (curr === 0) {
      // New chat or cleared — always reset to welcome
      setPhase('welcome');
    } else if (prev === 0 && curr > 0) {
      // First message sent — animate input to bottom
      setPhase('transitioning');
      setTimeout(() => setPhase('chat'), 420);
    } else if (curr > 0 && phase === 'welcome') {
      // Loaded an existing chat — skip animation, go straight to chat
      setPhase('chat');
    }

    prevLen.current = curr;
  }, [messages.length]);

  // Called by MessageBubble when user saves an inline edit.
  // Truncates the conversation at that message and immediately resends.
  const handleEdit = (msgId, newContent) => {
    const idx = messagesRef.current.findIndex(m => m.id === msgId);
    const truncated = idx !== -1 ? messagesRef.current.slice(0, idx) : messagesRef.current;
    setMessages(truncated);
    const model = localStorage.getItem('tb-model') || undefined;
    sendMessage(newContent, null, truncated, null, null, model);
  };

  const handleSend = async (content, q, mode) => {
    let fileData = null;
    if (file) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('http://localhost:3001/api/files/upload', { method: 'POST', body: fd });
        if (r.ok) fileData = await r.json();
      } catch {}
    }
    const model = localStorage.getItem('tb-model') || undefined;
    sendMessage(content, q, messagesRef.current, fileData, mode, model);
    setFile(null);
    setText('');
  };

  const lastMsg = messages[messages.length - 1];
  const showWelcome = messages.length === 0;       // drives greeting visibility
  const isWelcome = phase === 'welcome';            // drives input position
  const isTransitioning = phase === 'transitioning';
  const inputBottom = isWelcome ? 'calc(50% - 90px)' : '0px';

  const inputBox = (
    <PromptInputBox
      onSend={(content, q, mode) => handleSend(content, q, mode)}
      onStop={stopStreaming}
      isLoading={streaming}
      text={text}
      setText={setText}
      file={file}
      setFile={setFile}
      quote={quote}
      onClearQuote={() => setQuote('')}
      levels={levels}
    />
  );

  return (
    <div style={{ flex: 1, position: 'relative', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── MESSAGES AREA ── */}
      <div style={{
        position: 'absolute', inset: 0, bottom: 140,
        overflowY: 'auto',
        opacity: showWelcome ? 0 : 1,
        transition: 'opacity 0.35s ease 0.1s',
        pointerEvents: showWelcome ? 'none' : 'auto',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 16px' }}>
          {messages.map(m => (
            <MessageBubble key={m.id} msg={m} onQuote={setQuote}
              onEdit={handleEdit}
              streaming={streaming && m.id === lastMsg?.id} />
          ))}
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>
              {error}
            </div>
          )}
          <div ref={bottom} />
        </div>
      </div>

      {/* ── WELCOME OVERLAY (greeting + pills) ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', paddingBottom: 260,
        pointerEvents: showWelcome ? 'auto' : 'none',
        opacity: showWelcome ? 1 : 0,
        transition: 'opacity 0.25s ease',
        userSelect: 'none',
      }}>
        {/* Greeting */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontSize: 36, fontWeight: 400,
            letterSpacing: '-0.02em', lineHeight: 1.2,
            color: 'var(--text)', marginBottom: 10,
          }}>
            Good {getTimeOfDay()}, Keyaan.
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-sub)', opacity: 0.5, fontWeight: 400 }}>
            Ask anything. I remember what matters.
          </p>
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 480, marginBottom: 48 }}>
          {PILLS.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => setText(label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 20,
                background: 'var(--surface)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--text-sub)', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
              <Icon size={11} style={{ opacity: 0.6 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── INPUT BOX — animates from center to bottom ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: inputBottom,
        transition: isTransitioning ? 'bottom 0.42s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        zIndex: 10,
        maxWidth: 700, margin: '0 auto', width: '100%',
      }}>
        {inputBox}
      </div>

    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
