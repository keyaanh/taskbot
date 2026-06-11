import { useRef, useEffect } from 'react';
import { ArrowUp, Mic, Paperclip, X } from 'lucide-react';
import useVoice from '../hooks/useVoice';
import VoiceBar from './VoiceBar';

const ACCEPTED = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.csv,.md,.xlsx,.xls';
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function InputBar({ onSend, disabled, quote, onClearQuote, text, setText, file, setFile }) {
  const ta = useRef(null);
  const fileRef = useRef(null);
  const { listening, transcript, levels, start, stop, cancel } = useVoice();

  useEffect(() => {
    if (!ta.current) return;
    ta.current.style.height = '24px';
    ta.current.style.height = Math.min(ta.current.scrollHeight, 180) + 'px';
  }, [text]);

  const submit = async () => {
    const t = text.trim();
    if ((!t && !file) || disabled) return;
    let fileData = null;
    if (file) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch(`${API}/files/upload`, { method: 'POST', body: fd });
        if (r.ok) fileData = await r.json();
      } catch {}
    }
    onSend(t, quote, fileData);
    setText(''); setFile(null); onClearQuote();
  };

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const handleVoiceConfirm = () => {
    stop();
    if (transcript.trim()) setText(prev => (prev + ' ' + transcript).trim());
  };

  const canSend = (text.trim().length > 0 || file !== null) && !disabled;

  const iconBtn = {
    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, flexShrink: 0, color: 'var(--text-faint)', transition: 'color 0.15s',
  };

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {quote && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, padding: '7px 12px', background: 'var(--surface)', borderLeft: '2px solid var(--border-hover)', borderRadius: '0 8px 8px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--text-sub)', flex: 1, fontStyle: 'italic', lineHeight: 1.5, margin: 0 }} className="line-clamp-2">{quote}</p>
          <button onClick={onClearQuote} style={{ ...iconBtn, padding: 0, marginTop: 1 }}><X size={12} /></button>
        </div>
      )}

      {file && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '5px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <Paperclip size={11} style={{ color: 'var(--text-sub)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-sub)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
          <button onClick={() => setFile(null)} style={{ ...iconBtn, padding: 0, marginLeft: 2 }}>
            <X size={11} />
          </button>
        </div>
      )}

      {listening ? (
        <VoiceBar
          transcript={transcript}
          levels={levels}
          onConfirm={handleVoiceConfirm}
          onCancel={cancel}
        />
      ) : (
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 4,
          background: 'var(--input-bg)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '8px 10px', transition: 'border-color 0.15s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}>

          <button onClick={() => fileRef.current?.click()}
            style={{ ...iconBtn, marginBottom: 1 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sub)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
            <Paperclip size={16} />
          </button>
          <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files[0]); e.target.value = ''; }} />

          <textarea
            ref={ta} value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Message Taskbot..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', resize: 'none', outline: 'none', border: 'none',
              fontSize: 15, color: 'var(--text)', fontFamily: 'inherit',
              lineHeight: '24px', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginBottom: 1 }}>
            {text.length > 10000 && <span style={{ fontSize: 10, color: '#7a5c00' }}>{text.length}/32k</span>}
            <button onClick={start}
              style={{ ...iconBtn }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sub)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Mic size={16} />
            </button>
            <button onClick={submit} disabled={!canSend}
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: canSend ? 'var(--btn-primary)' : 'var(--surface2)',
                border: `1px solid ${canSend ? 'transparent' : 'var(--border)'}`,
                color: canSend ? 'var(--btn-primary-text)' : 'var(--text-faint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: canSend ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
              }}>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
        Taskbot can make mistakes. Verify important information.
      </p>
    </div>
  );
}
