import { useState, useEffect } from 'react';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Analytics from './components/Analytics';
import { Sun, Moon, BarChart2 } from 'lucide-react';
import './index.css';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tb-theme') || 'dark');
  const [view, setView] = useState('chat');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tb-theme', theme);
  }, [theme]);

  const iconBtn = (active) => ({
    width: 34, height: 34, borderRadius: '50%',
    background: active ? 'var(--surface2)' : 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-sub)', transition: 'all 0.15s',
  });

  return (
    <ChatProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
        <Sidebar onAnalytics={() => setView('analytics')} />
        {view === 'chat' ? <ChatWindow /> : <Analytics onBack={() => setView('chat')} />}
      </div>

      {/* Controls bottom-right */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', gap: 6, zIndex: 50 }}>
        <button onClick={() => setView(v => v === 'analytics' ? 'chat' : 'analytics')}
          title="Analytics" style={iconBtn(view === 'analytics')}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
          <BarChart2 size={14} />
        </button>
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title="Toggle theme" style={iconBtn(false)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </ChatProvider>
  );
}
