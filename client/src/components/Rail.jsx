import { Plus, MessageSquare, Plug, BarChart2, Settings } from 'lucide-react';
import TaskbotIcon from './TaskbotIcon';

function RailBtn({ icon: Icon, title, active, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--surface2)' : 'transparent',
        border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
        color: active ? 'var(--text)' : 'var(--text-sub)',
        cursor: 'pointer', transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--surface)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--text)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = active ? 'var(--surface2)' : 'transparent';
        e.currentTarget.style.borderColor = active ? 'var(--border)' : 'transparent';
        e.currentTarget.style.color = active ? 'var(--text)' : 'var(--text-sub)';
      }}
    >
      <Icon size={16} />
    </button>
  );
}

export default function Rail({ chatPanelOpen, onToggleChatPanel, onNewChat, onCustomize, onAnalytics, onSettings, activeView }) {
  return (
    <div style={{
      width: 52, flexShrink: 0, height: '100vh',
      background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 0', gap: 2, zIndex: 40, position: 'relative',
    }}>
      {/* Brand */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8, flexShrink: 0,
      }}>
        <TaskbotIcon size={14} color="var(--gold)" />
      </div>

      {/* Top actions */}
      <RailBtn icon={Plus}          title="New chat"  onClick={onNewChat} />
      <RailBtn icon={MessageSquare} title="Chats"     active={chatPanelOpen}           onClick={onToggleChatPanel} />

      {/* Separator */}
      <div style={{ width: 24, height: 1, background: 'var(--border)', margin: '6px 0', flexShrink: 0 }} />

      <RailBtn icon={Plug}      title="Customize" active={activeView === 'customize'} onClick={onCustomize} />
      <RailBtn icon={BarChart2} title="Analytics" active={activeView === 'analytics'} onClick={onAnalytics} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom */}
      <RailBtn icon={Settings} title="Settings" onClick={onSettings} />
    </div>
  );
}
