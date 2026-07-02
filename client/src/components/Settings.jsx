import { useState, useEffect } from 'react';
import { X, Check, ExternalLink, Cpu, Sliders, Trash2, Eye, EyeOff, Plus, RefreshCw, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Logo storage helpers ──────────────────────────────────────────────────────

const LOGO_KEY = 'tb-integration-logos';
const getStoredLogos = () => { try { return JSON.parse(localStorage.getItem(LOGO_KEY) || '{}'); } catch { return {}; } };

// ── Logo — read-only, uses saved image if set ─────────────────────────────────

function EditableLogo({ id, size = 20 }) {
  const [imgError, setImgError] = useState(false);
  const customUrl = getStoredLogos()[id] || null;
  if (customUrl && !imgError)
    return <img src={customUrl} alt="" onError={() => setImgError(true)}
             style={{ width: size, height: size, borderRadius: 4, objectFit: 'cover', display: 'block', flexShrink: 0 }} />;
  return <DefaultLogo id={id} size={size} />;
}

// ── Default SVG logos (fallback) ──────────────────────────────────────────────

const DefaultLogo = ({ id, size = 20 }) => {
  const s = { width: size, height: size, flexShrink: 0 };
  switch (id) {
    case 'google-calendar':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5"/>
          <rect x="3" y="5" width="18" height="16" rx="1.5" fill="#fff" stroke="#dadce0" strokeWidth="1"/>
          <rect x="3" y="5" width="18" height="5" rx="1.5" fill="#1a73e8"/>
          <rect x="3" y="8" width="18" height="2" fill="#1a73e8"/>
          <line x1="8" y1="3" x2="8" y2="7" stroke="#1a73e8" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="16" y1="3" x2="16" y2="7" stroke="#1a73e8" strokeWidth="1.5" strokeLinecap="round"/>
          <text x="12" y="19" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1a73e8" fontFamily="sans-serif">G</text>
        </svg>
      );
    case 'notion':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5"/>
          <path d="M6 5.5h7.5l4.5 4.5V19a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5z" fill="#fff" stroke="#37352f" strokeWidth="1"/>
          <path d="M13.5 5.5V10H18" stroke="#37352f" strokeWidth="1" fill="none"/>
          <line x1="8" y1="12.5" x2="16" y2="12.5" stroke="#37352f" strokeWidth="1"/>
          <line x1="8" y1="15" x2="13" y2="15" stroke="#37352f" strokeWidth="1"/>
        </svg>
      );
    case 'gmail':
      return (
        <svg {...s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5"/>
          <path d="M4 7h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" fill="#fff" stroke="#dadce0" strokeWidth="1"/>
          <path d="M4 7l8 6 8-6" stroke="#ea4335" strokeWidth="1.5" fill="none"/>
          <path d="M4 7l8 6" stroke="#ea4335" strokeWidth="1.5"/>
          <path d="M20 7l-8 6" stroke="#ea4335" strokeWidth="1.5"/>
        </svg>
      );
    case 'slack':
      return (
        <svg {...s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#611f69"/>
          <path d="M8.5 13.5a1.5 1.5 0 1 1-3 0v-3a1.5 1.5 0 0 1 3 0v1h3v-1a1.5 1.5 0 0 1 3 0v3a1.5 1.5 0 0 1-3 0v-1h-3v1z" fill="#e01e5a"/>
          <path d="M10.5 8.5a1.5 1.5 0 1 1 0-3h3a1.5 1.5 0 0 1 0 3h-1v3h1a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 1 0-3h1v-3h-1z" fill="#36c5f0"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="#2eb67d"/>
          <circle cx="15.5" cy="15.5" r="1.5" fill="#ecb22e"/>
        </svg>
      );
    case 'postgres':
      return (
        <svg {...s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#336791"/>
          <path d="M12 4C9 4 7 6 7 9v6c0 3 2 5 5 5s5-2 5-5V9c0-3-2-5-5-5z" fill="none" stroke="#fff" strokeWidth="1.2"/>
          <ellipse cx="12" cy="9" rx="5" ry="2.5" fill="#fff" opacity="0.9"/>
          <line x1="7" y1="12" x2="17" y2="12" stroke="#fff" strokeWidth="0.8" opacity="0.6"/>
        </svg>
      );
    case 'drive':
      return (
        <svg {...s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5"/>
          <path d="M12 4L4 18h4l4-7 4 7h4L12 4z" fill="none"/>
          <path d="M4 18l4-7 4 7H4z" fill="#0f9d58"/>
          <path d="M12 4l4 7 4 7h-8l4-7-4-7z" fill="#fbbc04"/>
          <path d="M8 11l4 7h8l-4-7H8z" fill="#4285f4"/>
        </svg>
      );
    default:
      return <div style={{ ...s, background: 'var(--surface2)', borderRadius: 4 }} />;
  }
};

// ── Provider catalogue ────────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: 'anthropic', label: 'Anthropic', color: '#d97706',
    models: [
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6', note: 'Fast & capable' },
      { id: 'claude-opus-4-5',           label: 'Claude Opus 4.5',   note: 'Most powerful' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5',  note: 'Fastest' },
    ],
    keyHint: 'sk-ant-…', default: true,
  },
  {
    id: 'openai', label: 'OpenAI', color: '#10b981',
    models: [
      { id: 'gpt-4o',      label: 'GPT-4o',      note: 'Most capable' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', note: 'Fast & cheap' },
    ],
    keyHint: 'sk-…', default: false,
  },
  {
    id: 'google', label: 'Google / Gemini', color: '#3b82f6',
    models: [
      { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro',   note: 'Most capable' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', note: 'Fast' },
    ],
    keyHint: 'AIza…', default: false,
  },
];

// ── Integrations catalogue ────────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    category: 'Productivity',
    items: [
      { id: 'google-calendar', name: 'Google Calendar', desc: 'Read and create calendar events' },
      { id: 'notion',          name: 'Notion',          desc: 'Search and write Notion pages' },
    ],
  },
  {
    category: 'Communication',
    items: [
      { id: 'gmail', name: 'Gmail',  desc: 'Search and draft emails' },
      { id: 'slack', name: 'Slack',  desc: 'Read and send Slack messages' },
    ],
  },
  {
    category: 'Data & Storage',
    items: [
      { id: 'postgres', name: 'PostgreSQL',   desc: 'Direct database connection' },
      { id: 'drive',    name: 'Google Drive', desc: 'Search and read Drive files' },
    ],
  },
];

const TABS = [
  { id: 'model',   label: 'Providers & Models', icon: Cpu },
  { id: 'mcp',     label: 'MCP Servers',        icon: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.3-6.7-2.1 2.1M8.4 15.6l-2.1 2.1m0-11.4 2.1 2.1m7.1 7.1 2.1 2.1"/>
    </svg>
  )},
  { id: 'general', label: 'General',             icon: Sliders },
];

// ── Provider card ─────────────────────────────────────────────────────────────

function ProviderCard({ provider, onSaved }) {
  const [key,    setKey]    = useState('');
  const [show,   setShow]   = useState(false);
  const [status, setStatus] = useState('idle');
  const [error,  setErr]    = useState('');
  const [conn,   setConn]   = useState(null);

  useEffect(() => {
    fetch(`${API}/keys`).then(r => r.json()).then(d => {
      const m = (d || []).find(k => k.provider === provider.id);
      if (m) { setConn(m); setStatus('connected'); }
    }).catch(() => {});
  }, [provider.id]);

  const save = async () => {
    if (!key.trim()) return;
    setStatus('validating'); setErr('');
    try {
      const r = await fetch(`${API}/keys/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.id, api_key: key.trim() }),
      });
      const d = await r.json();
      if (d.valid) { setStatus('connected'); setConn(d); setKey(''); onSaved?.(); }
      else { setStatus('invalid'); setErr(d.error || 'Validation failed'); }
    } catch { setStatus('invalid'); setErr('Network error — check your connection'); }
  };

  const disconnect = async () => {
    await fetch(`${API}/keys/${provider.id}`, { method: 'DELETE' });
    setConn(null); setStatus('idle'); setKey('');
  };

  const badge = {
    idle:       { label: provider.default ? 'Using app default key' : 'Not connected', color: provider.default ? '#10b981' : 'var(--text-faint)' },
    validating: { label: 'Validating…',    color: '#d97706' },
    connected:  { label: provider.default ? 'Connected ✓ (overrides app key)' : 'Connected ✓', color: '#10b981' },
    invalid:    { label: 'Invalid key',    color: '#ef4444' },
  }[status];

  return (
    <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface)', border: `1px solid ${status === 'connected' ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: provider.color }}>{provider.label}</span>
          {provider.default && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>default</span>}
        </div>
        <span style={{ fontSize: 11, color: badge.color }}>{badge.label}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {provider.models.map(m => (
          <span key={m.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>{m.label}</span>
        ))}
      </div>
      {status === 'connected' && conn ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-sub)', fontFamily: 'monospace' }}>
            ···{conn.key_preview}
            {conn.last_validated_at && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-faint)' }}>validated {new Date(conn.last_validated_at).toLocaleDateString()}</span>}
          </span>
          <button onClick={disconnect} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Trash2 size={11} /> {provider.default ? 'Remove (revert to app key)' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type={show ? 'text' : 'password'} value={key} onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()} placeholder={provider.keyHint}
              style={{ width: '100%', padding: '7px 34px 7px 10px', borderRadius: 8, background: 'var(--surface2)', border: `1px solid ${status === 'invalid' ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, color: 'var(--text)', fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}>
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <button onClick={save} disabled={!key.trim() || status === 'validating'}
            style={{ padding: '7px 14px', borderRadius: 8, background: key.trim() ? 'var(--btn-bg)' : 'var(--surface2)', border: 'none', color: key.trim() ? 'var(--btn-text)' : 'var(--text-faint)', fontSize: 13, cursor: key.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
            {status === 'validating' ? 'Checking…' : 'Save & Validate'}
          </button>
        </div>
      )}
      {status === 'invalid' && error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      )}
    </div>
  );
}

// ── MCP Server management ─────────────────────────────────────────────────────

function McpTab() {
  const [servers,    setServers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [name,       setName]       = useState('');
  const [url,        setUrl]        = useState('');
  const [adding,     setAdding]     = useState(false);
  const [addError,   setAddError]   = useState('');
  const [showForm,   setShowForm]   = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API}/mcp`).then(r => r.json()).then(d => { setServers(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addServer = async () => {
    if (!name.trim() || !url.trim()) return;
    setAdding(true); setAddError('');
    try {
      const r = await fetch(`${API}/mcp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), url: url.trim() }),
      });
      const d = await r.json();
      if (d.error) { setAddError(d.error); }
      else { setName(''); setUrl(''); setShowForm(false); load(); }
    } catch { setAddError('Could not connect to server'); }
    finally { setAdding(false); }
  };

  const remove = async (id) => {
    await fetch(`${API}/mcp/${id}`, { method: 'DELETE' });
    setServers(s => s.filter(x => x.id !== id));
  };

  const sync = async (id) => {
    await fetch(`${API}/mcp/${id}/sync`, { method: 'POST' });
    load();
  };

  const toggle = async (id, enabled) => {
    await fetch(`${API}/mcp/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_enabled: enabled }) });
    setServers(s => s.map(x => x.id === id ? { ...x, is_enabled: enabled } : x));
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20, lineHeight: 1.6 }}>
        Connect MCP (Model Context Protocol) servers to give Taskbot real tools — calendar access, web search, file operations, or any custom capability your server exposes.
      </p>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Loading…</p>
      ) : servers.length === 0 && !showForm ? (
        <div style={{ padding: '24px 20px', borderRadius: 12, border: '1px dashed var(--border)', textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: '0 0 12px' }}>No MCP servers connected yet.</p>
          <button onClick={() => setShowForm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: 'var(--btn-bg)', border: 'none', color: 'var(--btn-text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={13} /> Add your first server
          </button>
        </div>
      ) : (
        <>
          {servers.map(s => (
            <div key={s.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: `1px solid ${s.is_enabled ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{s.name}</p>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: s.is_enabled ? 'rgba(16,185,129,0.1)' : 'var(--surface2)', color: s.is_enabled ? '#10b981' : 'var(--text-faint)', border: `1px solid ${s.is_enabled ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
                    {s.is_enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '0 0 4px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</p>
                {s.tools?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {s.tools.slice(0, 6).map(t => (
                      <span key={t.name} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>{t.name}</span>
                    ))}
                    {s.tools.length > 6 && <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>+{s.tools.length - 6} more</span>}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button onClick={() => sync(s.id)} title="Re-sync tools" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', display: 'flex', padding: 4 }}><RefreshCw size={13} /></button>
                <button onClick={() => toggle(s.id, !s.is_enabled)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {s.is_enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => remove(s.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', padding: 4 }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Add server form */}
      {(showForm || servers.length > 0) && (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
              <Plus size={13} /> Add server
            </button>
          ) : (
            <div style={{ marginTop: 12, padding: '14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', margin: '0 0 10px' }}>Add MCP server</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. My Calendar)"
                  style={{ flex: '0 0 140px', padding: '7px 10px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://my-mcp-server.com"
                  onKeyDown={e => e.key === 'Enter' && addServer()}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontFamily: 'monospace', outline: 'none' }} />
              </div>
              {addError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={12} style={{ color: '#f87171' }} />
                  <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{addError}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setShowForm(false); setAddError(''); }} style={{ padding: '5px 12px', borderRadius: 7, background: 'none', border: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={addServer} disabled={adding || !name.trim() || !url.trim()}
                  style={{ padding: '5px 14px', borderRadius: 7, background: 'var(--btn-bg)', border: 'none', color: 'var(--btn-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', opacity: adding || !name.trim() || !url.trim() ? 0.5 : 1 }}>
                  {adding ? 'Connecting…' : 'Connect'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-tabs ──────────────────────────────────────────────────────────────────

function ModelTab({ onSaved }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20, lineHeight: 1.6 }}>
        Add API keys to unlock models from other providers, or override Anthropic's default key with your own. The app ships with an Anthropic key so everything works out of the box. Your keys are validated before saving and never returned in plaintext.
      </p>
      {PROVIDERS.map(p => <ProviderCard key={p.id} provider={p} onSaved={onSaved} />)}
    </div>
  );
}

// Map integration id → backend provider key
const PROVIDER_MAP = {
  'google-calendar': 'google_calendar',
  'gmail':           'gmail',
  'notion':          'notion',
  'slack':           'slack',
};

function IntegrationCard({ item, connections, onRefresh }) {
  const provider  = PROVIDER_MAP[item.id];
  const conn      = connections.find(c => c.provider === provider);
  const connected = conn?.status === 'connected';
  const expired   = conn?.status === 'expired';
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const connect = () => {
    const popup = window.open(
      `${API}/connections/oauth/${provider}`,
      'oauth_popup',
      'width=520,height=640,scrollbars=yes,resizable=yes'
    );
    const handler = (e) => {
      if ((e.data?.type === 'oauth_success' || e.data?.type === 'oauth_error') && e.data.provider === provider) {
        window.removeEventListener('message', handler);
        onRefresh();
      }
    };
    window.addEventListener('message', handler);
    const timer = setInterval(() => { if (popup?.closed) { clearInterval(timer); window.removeEventListener('message', handler); onRefresh(); } }, 800);
  };

  const disconnect = async () => {
    setLoading(true);
    await fetch(`${API}/connections/${provider}`, { method: 'DELETE' });
    onRefresh();
    setLoading(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: '11px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}
    >
      {/* Normalized icon container — 36×36px rounded square */}
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EditableLogo id={item.id} size={20} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{item.name}</p>
          {connected && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', flexShrink: 0 }}>Connected ✓</span>}
          {expired   && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', flexShrink: 0 }}>Expired</span>}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-sub)', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
        {conn?.connected_at && (
          <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: '2px 0 0' }}>
            Connected {new Date(conn.connected_at).toLocaleDateString()}
          </p>
        )}
      </div>

      <div style={{ flexShrink: 0, width: 90, display: 'flex', justifyContent: 'flex-end' }}>
        {connected ? (
          <button onClick={disconnect} disabled={loading}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 7, background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', opacity: hovered ? 1 : 0, transition: 'opacity 150ms ease', pointerEvents: hovered ? 'auto' : 'none' }}>
            {loading ? '…' : 'Disconnect'}
          </button>
        ) : (
          <button onClick={connect}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 7, background: 'var(--btn-bg)', border: 'none', color: 'var(--btn-text)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {expired ? 'Reconnect' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const [connections, setConnections] = useState([]);

  const refresh = () => {
    fetch(`${API}/connections`).then(r => r.json()).then(d => setConnections(Array.isArray(d) ? d : [])).catch(() => {});
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 24, lineHeight: 1.6 }}>
        Connect services so Taskbot can read your calendar, emails, Notion pages, and Slack messages during conversations. Each connection opens a secure OAuth login.
      </p>
      {INTEGRATIONS.map(group => (
        <div key={group.category} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: 10 }}>{group.category}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {group.items.map(item => (
              <IntegrationCard key={item.id} item={item} connections={connections} onRefresh={refresh} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared row primitive ──────────────────────────────────────────────────────

function SettingRow({ label, sub, children, topAlign = false }) {
  return (
    <div style={{ display: 'flex', alignItems: topAlign ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 16, padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-sub)', margin: '2px 0 0', lineHeight: 1.4 }}>{sub}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-sub)', margin: '20px 0 4px' }}>{children}</p>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{ width: 36, height: 20, borderRadius: 10, background: value ? '#10b981' : 'var(--surface2)', border: `1px solid ${value ? '#10b981' : 'var(--border)'}`, cursor: 'pointer', padding: 0, position: 'relative', transition: 'background 150ms, border-color 150ms', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 2, left: value ? 17 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 150ms', display: 'block' }} />
    </button>
  );
}

const FONT_OPTIONS = [
  { value: 'sans',  label: 'System sans-serif', style: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } },
  { value: 'serif', label: 'Serif',              style: { fontFamily: 'Georgia, "Times New Roman", serif' } },
  { value: 'mono',  label: 'Monospace',          style: { fontFamily: '"Fira Code", "Cascadia Code", "Menlo", monospace' } },
];

export const CHAT_FONT_MAP = {
  sans:  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono:  '"Fira Code", "Cascadia Code", "Menlo", monospace',
};

function GeneralTab({ onFontChange }) {
  const [prefs,     setPrefs]     = useState(null);
  const [draft,     setDraft]     = useState({});
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [clearing,  setClearing]  = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch(`${API}/preferences`).then(r => r.json()).then(d => {
      setPrefs(d);
      setDraft(d);
    }).catch(() => {});
  }, []);

  const patch = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  const save = async () => {
    setSaving(true);
    await fetch(`${API}/preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    if (draft.chat_font) onFontChange?.(draft.chat_font);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearMemory = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setClearing(true);
    try {
      const r = await fetch(`${API}/memory`);
      const cards = await r.json();
      await Promise.all(cards.map(c => fetch(`${API}/memory/${c.id}`, { method: 'DELETE' })));
    } finally { setClearing(false); setConfirmed(false); }
  };

  const inputStyle = {
    width: '100%', padding: '7px 10px', borderRadius: 8,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 13, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };

  if (!prefs) return <p style={{ fontSize: 13, color: 'var(--text-faint)', padding: '20px 0' }}>Loading…</p>;

  return (
    <div>
      {/* ── Profile ── */}
      <SectionHeading>Profile</SectionHeading>

      <SettingRow label="Full name">
        <input
          style={{ ...inputStyle, width: 200 }}
          value={draft.full_name ?? ''}
          onChange={e => patch('full_name', e.target.value)}
          placeholder="Your name"
        />
      </SettingRow>

      <SettingRow label="What should Taskbot call you?" sub="Used when the AI addresses you directly">
        <input
          style={{ ...inputStyle, width: 200 }}
          value={draft.preferred_name ?? ''}
          onChange={e => patch('preferred_name', e.target.value)}
          placeholder="Nickname or first name"
        />
      </SettingRow>

      <div style={{ padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: '0 0 8px' }}>Instructions for Taskbot</p>
        <p style={{ fontSize: 12, color: 'var(--text-sub)', margin: '0 0 8px', lineHeight: 1.4 }}>Standing instructions Taskbot will follow across all chats.</p>
        <textarea
          value={draft.instructions ?? ''}
          onChange={e => patch('instructions', e.target.value)}
          placeholder="e.g. when learning new concepts, I find analogies particularly helpful"
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {/* ── Preferences ── */}
      <SectionHeading>Preferences</SectionHeading>

      <SettingRow label="Chat font" sub="Font used in conversation messages">
        <select
          value={draft.chat_font ?? 'sans'}
          onChange={e => patch('chat_font', e.target.value)}
          style={{ ...inputStyle, width: 180, cursor: 'pointer' }}
        >
          {FONT_OPTIONS.map(f => (
            <option key={f.value} value={f.value} style={f.style}>{f.label}</option>
          ))}
        </select>
      </SettingRow>

      {/* ── Notifications ── */}
      <SectionHeading>Notifications</SectionHeading>

      <SettingRow
        label="Response completions"
        sub="Get a browser notification when Taskbot finishes a long response"
      >
        <Toggle
          value={draft.notify_on_complete ?? false}
          onChange={val => {
            if (val && Notification.permission === 'default') {
              Notification.requestPermission();
            }
            patch('notify_on_complete', val);
          }}
        />
      </SettingRow>

      {/* ── Save button ── */}
      <div style={{ padding: '16px 0 4px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving}
          style={{ padding: '7px 18px', borderRadius: 8, background: saved ? 'rgba(16,185,129,0.15)' : 'var(--btn-bg)', border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none', color: saved ? '#10b981' : 'var(--btn-text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 200ms, color 200ms' }}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>

      {/* ── Danger zone ── */}
      <SectionHeading>Data</SectionHeading>

      <div style={{ padding: '13px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#f87171', margin: '0 0 2px' }}>Clear all memory</p>
          <p style={{ fontSize: 12, color: 'var(--text-sub)', margin: 0 }}>Permanently deletes all saved memory cards</p>
        </div>
        <button onClick={clearMemory} disabled={clearing}
          style={{ padding: '6px 12px', borderRadius: 8, background: confirmed ? 'rgba(239,68,68,0.15)' : 'var(--surface2)', border: `1px solid ${confirmed ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, color: confirmed ? '#f87171' : 'var(--text-sub)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {clearing ? 'Clearing…' : confirmed ? 'Confirm delete' : 'Clear memory'}
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Settings({ onClose, onProvidersChanged, onFontChange }) {
  const [tab, setTab] = useState('model');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 700, maxHeight: '85vh', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', display: 'flex', padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: 175, borderRight: '1px solid var(--border)', padding: '12px 8px', flexShrink: 0 }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 2, cursor: 'pointer', background: tab === id ? 'var(--surface)' : 'transparent', border: `1px solid ${tab === id ? 'var(--border)' : 'transparent'}`, color: tab === id ? 'var(--text)' : 'var(--text-sub)', fontSize: 13, fontFamily: 'inherit', textAlign: 'left' }}>
                <Icon size={14} style={{ flexShrink: 0 }} />{label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
            {tab === 'model'   && <ModelTab onSaved={onProvidersChanged} />}
            {tab === 'mcp'     && <McpTab />}
            {tab === 'general' && <GeneralTab onFontChange={onFontChange} />}
          </div>
        </div>
      </div>
    </div>
  );
}
