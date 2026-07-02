import { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Trash2, Download, MessageSquare, Brain, X, CheckSquare, Square } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function relTime(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function ChatHistoryPanel({ onClose, onMemory }) {
  const { chats, activeId, loadChats, loadMessages, deleteChat, exportChat } = useChat();
  const [hovered,    setHovered]    = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected,   setSelected]   = useState(new Set());
  const [deleting,   setDeleting]   = useState(false);

  useEffect(() => { loadChats(); }, []);

  const toggleSelect = (id) => setSelected(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const selectAll     = () => setSelected(new Set(chats.map(c => c.id)));
  const clearSel      = () => { setSelected(new Set()); setSelectMode(false); };

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
      width: 252, flexShrink: 0, height: '100vh',
      background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInLeft 0.2s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '13px 12px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>Chats</p>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2, display: 'flex', borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sub)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
          <X size={13} />
        </button>
      </div>

      {/* Select toolbar */}
      {selectMode && (
        <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-sub)', flex: 1 }}>{selected.size} selected</span>
          <button onClick={selectAll} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 5, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit' }}>All</button>
          <button onClick={deleteSelected} disabled={!selected.size || deleting}
            style={{ fontSize: 11, padding: '2px 6px', borderRadius: 5, background: selected.size ? 'rgba(239,68,68,0.1)' : 'var(--surface2)', border: `1px solid ${selected.size ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, color: selected.size ? '#f87171' : 'var(--text-faint)', cursor: selected.size ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {deleting ? '…' : 'Delete'}
          </button>
          <button onClick={clearSel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2, display: 'flex' }}><X size={12} /></button>
        </div>
      )}

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {chats.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 6px' }}>
            <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Recent</p>
            {!selectMode && (
              <button onClick={() => setSelectMode(true)} style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '1px 4px', borderRadius: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sub)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                Select
              </button>
            )}
          </div>
        )}

        {chats.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', paddingTop: 32 }}>No chats yet.</p>
        )}

        {chats.map(c => {
          const isSel = selected.has(c.id);
          return (
            <div key={c.id}
              style={{ position: 'relative', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', marginBottom: 1, display: 'flex', alignItems: 'center', gap: 7, background: isSel ? 'rgba(217,119,6,0.08)' : activeId === c.id ? 'var(--surface)' : 'transparent', border: `1px solid ${isSel ? 'var(--gold-border)' : activeId === c.id ? 'var(--border)' : 'transparent'}`, transition: 'all 0.12s' }}
              onMouseEnter={e => { setHovered(c.id); if (!isSel && activeId !== c.id) e.currentTarget.style.background = 'var(--surface)'; }}
              onMouseLeave={e => { setHovered(null); if (!isSel && activeId !== c.id) e.currentTarget.style.background = 'transparent'; }}
              onClick={() => { if (selectMode) { toggleSelect(c.id); } else { loadMessages(c.id); onClose(); } }}>

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
                <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
                  <button onClick={e => { e.stopPropagation(); exportChat(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: 'var(--text-sub)', display: 'flex' }}><Download size={11} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteChat(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: 'var(--text-sub)', display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}><Trash2 size={11} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Memory button */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onMemory}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: 'none', border: '1px solid transparent', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}>
          <Brain size={13} />
          <span>Memory</span>
        </button>
      </div>
    </div>
  );
}
