import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import {
  Plus, MessageSquare, Plug, BarChart2, Settings,
  Brain, Trash2, Download, PanelLeft, CheckSquare, Square, X,
} from 'lucide-react';
import TaskbotIcon from './TaskbotIcon';

const API    = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const W_OPEN = 260;
const W_SHUT = 52;

function relTime(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return 'now';
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ── Generic nav row ───────────────────────────────────────────────────────────

function NavRow({ icon: Icon, label, active, onClick, open }) {
  return (
    <button
      onClick={onClick}
      title={!open ? label : undefined}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        gap: 10, padding: open ? '7px 10px' : '7px 8px',
        borderRadius: 8, cursor: 'pointer',
        background: active ? 'var(--surface)' : 'transparent',
        border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
        color: active ? 'var(--text)' : 'var(--text-sub)',
        fontSize: 13, fontFamily: 'inherit', textAlign: 'left',
        transition: 'all 0.12s', whiteSpace: 'nowrap', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-sub)'; } }}
    >
      <Icon size={15} style={{ flexShrink: 0 }} />
      {open && <span>{label}</span>}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Sidebar({
  open, onToggle,
  activeView, onNewChat, onCustomize, onAnalytics, onSettings, onMemory, onChatSelect,
}) {
  const { chats, activeId, loadChats, loadMessages, deleteChat, exportChat } = useChat();
  const [hovered,    setHovered]    = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected,   setSelected]   = useState(new Set());
  const [deleting,   setDeleting]   = useState(false);

  const w = open ? W_OPEN : W_SHUT;

  const toggleSelect = (id) => setSelected(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });
  const selectAll = () => setSelected(new Set(chats.map(c => c.id)));
  const clearSel  = () => { setSelected(new Set()); setSelectMode(false); };

  const deleteSelected = async () => {
    if (!selected.size) return;
    setDeleting(true);
    await Promise.all([...selected].map(id => fetch(`${API}/chats/${id}`, { method: 'DELETE' })));
    await loadChats();
    clearSel();
    setDeleting(false);
  };

  return (
    <div style={{
      width: w, flexShrink: 0, height: '100vh',
      background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', flexShrink: 0, minHeight: 52 }}>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TaskbotIcon size={13} color="var(--gold)" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.02em', color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap' }}>Taskbot</span>
          </div>
        )}
        <button
          onClick={onToggle}
          title={open ? 'Close sidebar' : 'Open sidebar'}
          style={{ width: 32, height: 32, borderRadius: 7, background: 'none', border: '1px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', flexShrink: 0, transition: 'all 0.12s', marginLeft: open ? 0 : 'auto', marginRight: open ? 0 : 'auto' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-sub)'; }}
        >
          <PanelLeft size={15} />
        </button>
      </div>

      {/* ── Top nav ── */}
      <div style={{ padding: '8px', flexShrink: 0 }}>
        <NavRow icon={Plus}         label="New chat"   open={open} onClick={onNewChat} />
      </div>

      {/* ── Recents / chat list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {open ? (
          <>
            {chats.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 4px' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Recents</p>
                {!selectMode ? (
                  <button onClick={() => setSelectMode(true)}
                    style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '1px 4px', borderRadius: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sub)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                    Select
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={selectAll} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit' }}>All</button>
                    <button onClick={deleteSelected} disabled={!selected.size || deleting}
                      style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: selected.size ? 'rgba(239,68,68,0.1)' : 'var(--surface2)', border: `1px solid ${selected.size ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, color: selected.size ? '#f87171' : 'var(--text-faint)', cursor: selected.size ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                      {deleting ? '…' : 'Delete'}
                    </button>
                    <button onClick={clearSel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '1px 2px', display: 'flex', alignItems: 'center' }}><X size={11} /></button>
                  </div>
                )}
              </div>
            )}

            {chats.map(c => {
              const isSel = selected.has(c.id);
              return (
                <div key={c.id}
                  style={{ borderRadius: 7, padding: '6px 8px', cursor: 'pointer', marginBottom: 1, display: 'flex', alignItems: 'center', gap: 7, background: isSel ? 'rgba(217,119,6,0.08)' : activeId === c.id ? 'var(--surface)' : 'transparent', border: `1px solid ${isSel ? 'var(--gold-border)' : activeId === c.id ? 'var(--border)' : 'transparent'}`, transition: 'all 0.1s' }}
                  onMouseEnter={e => { setHovered(c.id); if (!isSel && activeId !== c.id) e.currentTarget.style.background = 'var(--surface)'; }}
                  onMouseLeave={e => { setHovered(null); if (!isSel && activeId !== c.id) e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => { if (selectMode) { toggleSelect(c.id); } else { loadMessages(c.id); onChatSelect?.(); } }}>

                  {selectMode ? (
                    <div style={{ flexShrink: 0, color: isSel ? 'var(--gold)' : 'var(--text-faint)', display: 'flex' }}>
                      {isSel ? <CheckSquare size={13} /> : <Square size={13} />}
                    </div>
                  ) : (
                    <MessageSquare size={11} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                  )}

                  <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>

                  {!selectMode && hovered !== c.id && (
                    <span style={{ fontSize: 10, color: 'var(--text-faint)', flexShrink: 0 }}>{relTime(c.updated_at)}</span>
                  )}
                  {!selectMode && hovered === c.id && (
                    <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: 2, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); exportChat(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: 'var(--text-sub)', display: 'flex' }}><Download size={11} /></button>
                      <button onClick={e => { e.stopPropagation(); deleteChat(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: 'var(--text-sub)', display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <NavRow icon={Plug}      label="Customize" open={open} active={activeView === 'customize'} onClick={onCustomize} />
        <NavRow icon={BarChart2} label="Analytics" open={open} active={activeView === 'analytics'} onClick={onAnalytics} />
        <NavRow icon={Brain}     label="Memory"    open={open} onClick={onMemory} />
        <NavRow icon={Settings}  label="Settings"  open={open} onClick={onSettings} />
      </div>
    </div>
  );
}
