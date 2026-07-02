import { useChat } from '../context/ChatContext';
import { Trash2, X } from 'lucide-react';

export default function MemoryDrawer({ onClose }) {
  const { memory, deleteMemory } = useChat();

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 300, zIndex: 50, background: 'var(--sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', animation: 'slideInLeft 0.22s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>Memory</h2>
            <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2, marginBottom: 0 }}>{memory.length} saved facts</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 4, borderRadius: 6, display: 'flex' }}>
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
  );
}
