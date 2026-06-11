import { useEffect, useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Plus, Trash2, Download, MessageSquare, Brain, X, PinIcon, CheckSquare, Square } from 'lucide-react';
import TaskbotIcon from './TaskbotIcon';

function relTime(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

const W_COLLAPSED = 52;
const W_EXPANDED  = 260;

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Sidebar({ onAnalytics }) {
  const { chats, activeId, memory, loadChats, loadMessages, loadMemory, newChat, deleteChat, deleteMemory, exportChat } = useChat();
  const [expanded, setExpanded]   = useState(false);
  const [pinned, setPinned]       = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [hovered, setHovered]     = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]   = useState(new Set());
  const [deleting, setDeleting]   = useState(false);
  const hoverTimer = useRef(null);

  useEffect(() => { loadChats(); loadMemory(); }, []);

  // Exit select mode if sidebar collapses
  useEffect(() => { if (!expanded && !pinned) { setSelectMode(false); setSelected(new Set()); } }, [expanded, pinned]);

  const handleMouseEnter = () => {
    if (pinned) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setExpanded(true), 120);
  };
  const handleMouseLeave = () => {
    if (pinned) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setExpanded(false), 200);
  };

  const isOpen = expanded || pinned;
  const w = isOpen ? W_EXPANDED : W_COLLAPSED;

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const selectAll = () => setSelected(new Set(chats.map(c => c.id)));
  const clearSelection = () => { setSelected(new Set()); setSelectMode(false); };

  const deleteSelected = async () => {
    if (!selected.size) return;
    setDeleting(true);
    await Promise.all([...selected].map(id => fetch(`${API}/chats/${id}`, { method: 'DELETE' })));
    await loadChats();
    clearSelection();
    setDeleting(false);
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: w, flexShrink: 0, height: '100vh',
          background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>

        {/* Header */}
        <div style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TaskbotIcon size={14} color="var(--gold)" />
          </div>
          {isOpen && (
            <>
              <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.02em', color: 'var(--text)', flex: 1, whiteSpace: 'nowrap' }}>Taskbot</span>
              <button onClick={() => setPinned(p => !p)} title={pinned ? 'Unpin' : 'Pin'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: pinned ? 'var(--gold)' : 'var(--text-faint)', padding: 4, borderRadius: 6, display: 'flex', transition: 'color 0.15s' }}>
                <PinIcon size={13} />
              </button>
            </>
          )}
        </div>

        {/* Select mode toolbar */}
        {isOpen && selectMode && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'var(--text-sub)', flex: 1 }}>
              {selected.size} selected
            </span>
            <button onClick={selectAll}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              All
            </button>
            <button onClick={deleteSelected} disabled={!selected.size || deleting}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: selected.size ? 'rgba(239,68,68,0.12)' : 'var(--surface2)', border: `1px solid ${selected.size ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, color: selected.size ? '#f87171' : 'var(--text-faint)', cursor: selected.size ? 'pointer' : 'not-allowed', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button onClick={clearSelection}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2, display: 'flex' }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* New chat */}
        {!selectMode && (
          <div style={{ padding: '8px 10px', flexShrink: 0 }}>
            <button onClick={newChat}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', background: 'none', border: '1px solid transparent', color: 'var(--text-sub)', fontFamily: 'inherit', fontSize: 13, transition: 'all 0.15s', overflow: 'hidden', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
              <Plus size={15} style={{ flexShrink: 0 }} />
              {isOpen && <span>New chat</span>}
            </button>
          </div>
        )}

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {isOpen && chats.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 6px' }}>
              <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Recent</p>
              {!selectMode && (
                <button onClick={() => setSelectMode(true)}
                  style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '1px 4px', borderRadius: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sub)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                  Select
                </button>
              )}
            </div>
          )}

          {isOpen ? chats.map(c => {
            const isSelected = selected.has(c.id);
            return (
              <div key={c.id}
                style={{
                  position: 'relative', borderRadius: 8, padding: '7px 8px',
                  cursor: 'pointer', marginBottom: 1,
                  background: isSelected ? 'rgba(217,119,6,0.08)' : activeId === c.id ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--gold-border)' : activeId === c.id ? 'var(--border)' : 'transparent'}`,
                  transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
                onMouseEnter={e => { setHovered(c.id); if (!isSelected && activeId !== c.id) e.currentTarget.style.background = 'var(--surface)'; }}
                onMouseLeave={e => { setHovered(null); if (!isSelected && activeId !== c.id) e.currentTarget.style.background = 'transparent'; }}
                onClick={() => selectMode ? toggleSelect(c.id) : loadMessages(c.id)}>

                {/* Checkbox or chat icon */}
                {selectMode ? (
                  <div style={{ flexShrink: 0, color: isSelected ? 'var(--gold)' : 'var(--text-faint)', display: 'flex', transition: 'color 0.15s' }}>
                    {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  </div>
                ) : (
                  <MessageSquare size={11} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                )}

                <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>

                {!selectMode && hovered !== c.id && (
                  <span style={{ fontSize: 10, color: 'var(--text-faint)', flexShrink: 0 }}>{relTime(c.updated_at)}</span>
                )}

                {/* Action buttons on hover (non-select mode) */}
                {!selectMode && hovered === c.id && (
                  <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: 2 }}>
                    <button onClick={e => { e.stopPropagation(); exportChat(c.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 5, color: 'var(--text-sub)', display: 'flex' }}>
                      <Download size={11} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteChat(c.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 5, color: 'var(--text-sub)', display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 4 }}>
              {chats.slice(0, 8).map(c => (
                <div key={c.id} onClick={() => loadMessages(c.id)} title={c.title}
                  style={{ width: 32, height: 32, borderRadius: 8, cursor: 'pointer', background: activeId === c.id ? 'var(--surface2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = activeId === c.id ? 'var(--surface2)' : 'none'}>
                  <MessageSquare size={13} style={{ color: activeId === c.id ? 'var(--text)' : 'var(--text-faint)' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom icons */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => setMemoryOpen(true)} title="Memory"
            style={{ width: 32, height: 32, borderRadius: 8, background: 'none', border: '1px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
            <Brain size={15} />
          </button>
        </div>
      </div>

      {/* Memory drawer */}
      {memoryOpen && (
        <>
          <div onClick={() => setMemoryOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', left: w, top: 0, bottom: 0, width: 300, zIndex: 50, background: 'var(--sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', animation: 'slideInLeft 0.22s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Memory</h2>
                <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>{memory.length} saved facts</p>
              </div>
              <button onClick={() => setMemoryOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 4, borderRadius: 6, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {memory.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', paddingTop: 32 }}>Nothing saved yet.</p>
              ) : memory.map(m => (
                <div key={m.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 4 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-sub)', flex: 1, lineHeight: 1.55 }}>{m.fact}</span>
                  <button onClick={() => deleteMemory(m.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0, flexShrink: 0, marginTop: 2, display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
