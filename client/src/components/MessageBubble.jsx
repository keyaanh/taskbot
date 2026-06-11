import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Edit3, Paperclip, ChevronDown, BrainCog } from 'lucide-react';
import TaskbotIcon from './TaskbotIcon';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || 'code';
  const code = String(children).replace(/\n$/, '');

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
        <code className={className}>{code}</code>
      </pre>
    </div>
  );
}

export default function MessageBubble({ msg, onQuote, onEdit, streaming }) {
  const [copied, setCopied] = useState(false);
  const [sel, setSel] = useState('');
  const [thinkOpen, setThinkOpen] = useState(false);
  const isUser = msg.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMouseUp = () => setSel(window.getSelection()?.toString().trim() || '');

  return (
    <div className="msg-enter" style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 24 }}>
      {!isUser && (
        <div style={{ flexShrink: 0, marginRight: 12, marginTop: 2, width: 28, height: 28 }}>
          {/* When streaming with no content yet: single pulsing dot */}
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

        {msg.file_name && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-sub)' }}>
            <Paperclip size={11} />
            {msg.file_name}
          </div>
        )}

        <div onMouseUp={handleMouseUp}
          style={isUser ? {
            background: 'var(--user-bubble)',
            border: '1px solid var(--user-border)',
            borderRadius: '16px 4px 16px 16px',
            padding: '10px 16px',
            fontSize: 15,
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            color: 'var(--text)',
          } : { fontSize: 15, lineHeight: 1.75 }}>
          {isUser ? (
            <span>{msg.content}</span>
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

        {sel && !isUser && (
          <button onClick={() => { onQuote(sel); setSel(''); window.getSelection()?.removeAllRanges(); }}
            style={{ marginTop: 6, fontSize: 11, background: 'none', border: '1px solid var(--border)', color: 'var(--text-sub)', padding: '3px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
            Reply to selection
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, paddingLeft: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {msg.token_count ? ` · ${msg.token_count}t` : ''}
          </span>
          <button onClick={copy}
            style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sub)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
          {isUser && (
            <button onClick={() => onEdit(msg.content)}
              style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sub)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Edit3 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
