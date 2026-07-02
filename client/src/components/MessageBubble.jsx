import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Edit3, Paperclip, ChevronDown, BrainCog, X, Wrench } from 'lucide-react';
import TaskbotIcon from './TaskbotIcon';

function ToolCallChip({ call }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--text-sub)', fontFamily: 'inherit' }}>
        <Wrench size={11} />
        Used tool: {call.name}
        <ChevronDown size={11} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div style={{ marginTop: 6, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6, fontFamily: 'Geist Mono, monospace' }}>
          <div style={{ marginBottom: 6 }}><strong style={{ color: 'var(--text)' }}>input:</strong> {JSON.stringify(call.input)}</div>
          <div><strong style={{ color: 'var(--text)' }}>result:</strong> {call.result ?? '…'}</div>
        </div>
      )}
    </div>
  );
}

// react-markdown/rehype-highlight pass `children` as nested React elements
// (highlight.js spans), not a plain string — String(children) on those
// stringifies to "[object Object]". Walk the tree to get the real text.
function extractText(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props?.children != null) return extractText(node.props.children);
  return '';
}

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || 'code';
  const code = extractText(children).replace(/\n$/, '');

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', margin: '12px 0' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '5px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--text-sub)' }}>{lang}</span>
        <button onClick={copy}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-sub)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}>
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <pre style={{ background: 'var(--sidebar)', padding: '14px 16px', overflowX: 'auto', margin: 0, fontFamily: 'Geist Mono, monospace', fontSize: 13, lineHeight: 1.65 }}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export default function MessageBubble({ msg, onQuote, onEdit, streaming }) {
  const [copied,      setCopied]    = useState(false);
  const [sel,         setSel]       = useState('');
  const [thinkOpen,   setThinkOpen] = useState(false);
  const [isEditing,   setIsEditing] = useState(false);
  const [editText,    setEditText]  = useState('');
  const taRef = useRef(null);
  const isUser = msg.role === 'user';

  // Auto-resize the inline textarea
  useEffect(() => {
    if (isEditing && taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = taRef.current.scrollHeight + 'px';
      taRef.current.focus();
      // Place cursor at end
      const len = taRef.current.value.length;
      taRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startEdit = () => {
    setEditText(msg.content);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const saveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === msg.content) { cancelEdit(); return; }
    setIsEditing(false);
    onEdit(msg.id, trimmed);   // parent truncates + resends
  };

  const handleMouseUp = () => setSel(window.getSelection()?.toString().trim() || '');

  return (
    <div className="msg-enter" style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 24 }}>
      {!isUser && (
        <div style={{ flexShrink: 0, marginRight: 12, marginTop: 2, width: 28, height: 28 }}>
          {streaming && !msg.content ? (
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TaskbotIcon size={14} color="var(--gold)" style={{ animation: 'starPulse 1.4s ease-in-out infinite' }} />
            </div>
          ) : (
            <div style={{ width: 28, height: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
              <TaskbotIcon size={13} color={streaming ? 'var(--gold)' : 'var(--text-sub)'} />
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: isUser ? '72%' : '100%', flex: isUser ? 'none' : 1 }}>
        {msg.thinking && (
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => setThinkOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--gold)', fontFamily: 'inherit' }}>
              <BrainCog size={12} />
              Thought process
              <ChevronDown size={11} style={{ transition: 'transform 0.2s', transform: thinkOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {thinkOpen && (
              <div style={{ marginTop: 6, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                {msg.thinking}
              </div>
            )}
          </div>
        )}

        {msg.quoted_text && (
          <div style={{ marginBottom: 8, paddingLeft: 10, borderLeft: '2px solid var(--border-hover)', color: 'var(--text-sub)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.5 }}>
            {msg.quoted_text}
          </div>
        )}

        {!isUser && msg.tool_calls?.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            {msg.tool_calls.map((call, i) => <ToolCallChip key={i} call={call} />)}
          </div>
        )}

        {msg.file_name && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-sub)' }}>
            <Paperclip size={11} />
            {msg.file_name}
          </div>
        )}

        {/* ── Message content / inline editor ── */}
        <div onMouseUp={handleMouseUp}
          style={isUser ? {
            background: isEditing ? 'transparent' : 'var(--user-bubble)',
            border: `1px solid ${isEditing ? 'var(--border-hover)' : 'var(--user-border)'}`,
            borderRadius: '16px 4px 16px 16px',
            padding: isEditing ? '8px 10px' : '10px 16px',
            fontSize: 15, lineHeight: 1.65, color: 'var(--text)',
            fontFamily: 'var(--chat-font)',
            transition: 'border-color 0.15s, background 0.15s',
          } : { fontSize: 15, lineHeight: 1.75, fontFamily: 'var(--chat-font)' }}>

          {isUser ? (
            isEditing ? (
              <textarea
                ref={taRef}
                value={editText}
                onChange={e => {
                  setEditText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === 'Escape') cancelEdit();
                }}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  resize: 'none', fontSize: 15, color: 'var(--text)', fontFamily: 'inherit',
                  lineHeight: 1.65, padding: 0, margin: 0, minHeight: 24, display: 'block',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <span>{msg.content}</span>
            )
          ) : (
            <div className="prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({ node, inline, className, children, ...props }) =>
                    inline
                      ? <code style={{ fontFamily: 'Geist Mono, monospace', background: 'var(--surface)', padding: '2px 6px', borderRadius: 5, fontSize: 13, border: '1px solid var(--border)' }}>{children}</code>
                      : <CodeBlock className={className}>{children}</CodeBlock>
                }}>
                {msg.content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Save / Cancel row — only while editing */}
        {isEditing && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={cancelEdit}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
              <X size={11} /> Cancel
            </button>
            <button onClick={saveEdit}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 8, background: 'var(--btn-bg)', border: 'none', color: 'var(--btn-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}>
              <Check size={11} /> Save & Resend
            </button>
          </div>
        )}

        {/* Sources */}
        {!isUser && msg.sources?.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Sources</p>
            {msg.sources.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{i + 1}.</span>
                <div style={{ minWidth: 0 }}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'var(--text-sub)', textDecoration: 'none', lineHeight: 1.4 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}>
                    {s.title || s.url}
                    {s.page_age && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-faint)' }}>{s.page_age}</span>}
                  </a>
                  {s.snippet && (
                    <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '2px 0 0', lineHeight: 1.4 }}>{s.snippet}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {sel && !isUser && (
          <button onClick={() => { onQuote(sel); setSel(''); window.getSelection()?.removeAllRanges(); }}
            style={{ marginTop: 6, fontSize: 11, background: 'none', border: '1px solid var(--border)', color: 'var(--text-sub)', padding: '3px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
            Reply to selection
          </button>
        )}

        {/* Timestamp / tokens / copy / edit */}
        {!isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, paddingLeft: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {streaming && !isUser
                ? <span style={{ marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>
                    · ~{Math.max(1, Math.round((msg.content || '').length / 4))} tokens
                  </span>
                : msg.token_count
                  ? <span style={{ marginLeft: 6 }}>· {msg.token_count} tokens</span>
                  : null}
            </span>
            <button onClick={copy}
              style={{ color: 'var(--text-sub)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}>
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
            {isUser && (
              <button onClick={startEdit} title="Edit and resend"
                style={{ color: 'var(--text-sub)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}>
                <Edit3 size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
