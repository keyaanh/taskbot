import { X, Check } from 'lucide-react';

export default function VoiceBar({ onConfirm, onCancel, transcript, levels }) {
  const hasVoice = levels?.some(l => l > 0.05);

  return (
    <div>
      {/* Transcript preview above bar */}
      {transcript && (
        <div style={{ marginBottom: 6, padding: '5px 12px', fontSize: 13, color: 'var(--text-sub)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {transcript}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--input-bg)', border: '1px solid var(--border-hover)',
        borderRadius: 14, padding: '8px 10px', height: 52,
      }}>
        {/* Cancel */}
        <button onClick={onCancel}
          style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-sub)', flexShrink: 0, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
          <X size={13} />
        </button>

        {/* Waveform */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5, height: 36 }}>
          {(levels || new Array(32).fill(0)).map((lvl, i) => {
            const h = Math.max(3, Math.round(lvl * 32));
            return (
              <div key={i} style={{
                width: 3, height: h + 'px', borderRadius: 2,
                background: lvl > 0.05 ? 'var(--text)' : 'var(--border-hover)',
                transition: 'height 0.05s ease',
                flexShrink: 0,
              }} />
            );
          })}
        </div>

        {/* Confirm */}
        <button onClick={onConfirm}
          style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--btn-primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--btn-primary-text)', flexShrink: 0, transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <Check size={13} />
        </button>
      </div>
    </div>
  );
}
