import { useState, useEffect } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Analytics from './components/Analytics';
import Customize from './components/Customize';
import Settings, { CHAT_FONT_MAP } from './components/Settings';
import MemoryDrawer from './components/MemoryDrawer';
import { Sun, Moon } from 'lucide-react';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function AppLayout({ theme, setTheme }) {
  const { newChat } = useChat();
  const [sidebarOpen,  setSidebar]   = useState(true);
  const [view,         setView]      = useState('chat');
  const [showSettings, setSettings]  = useState(false);
  const [showMemory,   setMemory]    = useState(false);
  const [chatFont,     setChatFont]  = useState('sans');

  useEffect(() => {
    fetch(`${API}/preferences`).then(r => r.json()).then(d => {
      if (d.chat_font) setChatFont(d.chat_font);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--chat-font', CHAT_FONT_MAP[chatFont] || CHAT_FONT_MAP.sans);
  }, [chatFont]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebar(p => !p)}
        activeView={view}
        onNewChat={() => { newChat(); setView('chat'); }}
        onChatSelect={() => setView('chat')}
        onCustomize={() => setView('customize')}
        onAnalytics={() => setView('analytics')}
        onSettings={() => setSettings(true)}
        onMemory={() => setMemory(true)}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'chat'      && <ChatWindow />}
        {view === 'analytics' && <Analytics onBack={() => setView('chat')} />}
        {view === 'customize' && <Customize />}
      </div>

      {/* Light/dark toggle */}
      <button
        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        title="Toggle theme"
        style={{ position: 'fixed', bottom: 20, right: 20, width: 34, height: 34, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-sub)', transition: 'all 0.15s', zIndex: 50 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {showSettings && (
        <Settings
          onClose={() => setSettings(false)}
          onProvidersChanged={() => {}}
          onFontChange={f => setChatFont(f)}
        />
      )}

      {showMemory && <MemoryDrawer onClose={() => setMemory(false)} />}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tb-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tb-theme', theme);
  }, [theme]);

  return (
    <ChatProvider>
      <AppLayout theme={theme} setTheme={setTheme} />
    </ChatProvider>
  );
}
