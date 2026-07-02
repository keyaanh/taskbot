import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Custom logo storage (shared with Settings.jsx) ────────────────────────────
const LOGO_KEY = 'tb-integration-logos';
const getLogos = () => { try { return JSON.parse(localStorage.getItem(LOGO_KEY) || '{}'); } catch { return {}; } };

// Read-only icon that respects custom logos
function SmallIcon({ id, size }) {
  const [err, setErr] = useState(false);
  const custom = getLogos()[id] || null;
  if (custom && !err)
    return <img src={custom} onError={() => setErr(true)} style={{ width: size, height: size, objectFit: 'cover' }} alt="" />;
  return <ConnectorIcon id={id} size={size} />;
}

// ── Icon renderers (same SVGs as Settings.jsx) ────────────────────────────────

function ConnectorIcon({ id, size = 22 }) {
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
    case 'gmail':
      return (
        <svg {...s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5"/>
          <path d="M4 7h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" fill="#fff" stroke="#dadce0" strokeWidth="1"/>
          <path d="M4 7l8 6 8-6" stroke="#ea4335" strokeWidth="1.5" fill="none"/>
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
        </svg>
      );
    case 'drive':
      return (
        <svg {...s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5"/>
          <path d="M4 18l4-7 4 7H4z" fill="#0f9d58"/>
          <path d="M12 4l4 7 4 7h-8l4-7-4-7z" fill="#fbbc04"/>
          <path d="M8 11l4 7h8l-4-7H8z" fill="#4285f4"/>
        </svg>
      );
    default:
      return <div style={{ ...s, background: 'var(--surface2)', borderRadius: 4 }} />;
  }
}

// ── Connector catalog ─────────────────────────────────────────────────────────

const CONNECTORS = [
  {
    id: 'google_calendar', iconId: 'google-calendar', name: 'Google Calendar',
    description: 'Connect Google Calendar to let Taskbot read your upcoming events and create new ones. Ask about your schedule, get weekly summaries, or have Taskbot plan meetings based on your availability.',
    tools: [
      { name: 'list_calendar_events', label: 'List calendar events',  kind: 'read' },
      { name: 'create_calendar_event', label: 'Create calendar events', kind: 'write' },
    ],
  },
  {
    id: 'gmail', iconId: 'gmail', name: 'Gmail',
    description: 'Connect Gmail to search your inbox, read full email content, and compose draft replies. Taskbot can surface relevant messages during conversations and help you write responses.',
    tools: [
      { name: 'search_emails',      label: 'Search emails',       kind: 'read' },
      { name: 'get_email',          label: 'Read email content',  kind: 'read' },
      { name: 'create_draft_email', label: 'Create draft emails', kind: 'write' },
    ],
  },
  {
    id: 'notion', iconId: 'notion', name: 'Notion',
    description: 'Connect Notion to search across your workspace, read page content, and create new pages. Useful for referencing documentation, notes, or capturing ideas directly into your workspace.',
    tools: [
      { name: 'search_notion',     label: 'Search workspace', kind: 'read' },
      { name: 'get_notion_page',   label: 'Read page content', kind: 'read' },
      { name: 'create_notion_page', label: 'Create new pages', kind: 'write' },
    ],
  },
  {
    id: 'slack', iconId: 'slack', name: 'Slack',
    description: 'Connect Slack to browse channels, read recent messages, post to channels, and search your workspace. Great for summarizing conversations or sending updates without leaving Taskbot.',
    tools: [
      { name: 'list_slack_channels',  label: 'List channels',        kind: 'read' },
      { name: 'get_slack_messages',   label: 'Read channel messages', kind: 'read' },
      { name: 'post_slack_message',   label: 'Post messages',         kind: 'write' },
      { name: 'search_slack',         label: 'Search workspace',      kind: 'read' },
    ],
  },
  {
    id: 'postgres', iconId: 'postgres', name: 'PostgreSQL',
    description: 'Connect a PostgreSQL database to let Taskbot run queries, explore schemas, and surface data insights during conversations.',
    tools: [],
  },
  {
    id: 'drive', iconId: 'drive', name: 'Google Drive',
    description: 'Connect Google Drive to search for documents, read file contents, and reference your Drive files during conversations.',
    tools: [],
  },
];

// ── Tool kind badge ───────────────────────────────────────────────────────────

function KindBadge({ kind }) {
  const isRead = kind === 'read';
  return (
    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: isRead ? 'rgba(59,130,246,0.08)' : 'rgba(217,119,6,0.08)', color: isRead ? '#60a5fa' : 'var(--gold)', border: `1px solid ${isRead ? 'rgba(59,130,246,0.2)' : 'rgba(217,119,6,0.25)'}` }}>
      {isRead ? 'read' : 'write'}
    </span>
  );
}

// ── Left nav item ─────────────────────────────────────────────────────────────

function NavItem({ label, active, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, marginBottom: 2, cursor: disabled ? 'default' : 'pointer', background: active ? 'var(--surface)' : 'transparent', border: `1px solid ${active ? 'var(--border)' : 'transparent'}`, color: active ? 'var(--text)' : disabled ? 'var(--text-faint)' : 'var(--text-sub)', fontSize: 13, fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.12s' }}
      onMouseEnter={e => { if (!disabled && !active) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={e => { if (!disabled && !active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-sub)'; } }}>
      {label}
    </button>
  );
}

// ── Connector list item ───────────────────────────────────────────────────────

function ConnectorItem({ connector, selected, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', background: selected ? 'var(--surface)' : 'transparent', border: `1px solid ${selected ? 'var(--border)' : 'transparent'}`, transition: 'all 0.12s', fontFamily: 'inherit' }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        <SmallIcon id={connector.iconId} size={16} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text)', textAlign: 'left' }}>{connector.name}</span>
    </button>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px 4px', cursor: 'pointer' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'none', margin: 0, letterSpacing: 0 }}>{children}</p>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ connector, conn, onConnect, onDisconnect }) {
  const connected  = conn?.status === 'connected';
  const expired    = conn?.status === 'expired';
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    const provider = connector.id;
    const popup = window.open(
      `${API}/connections/oauth/${provider}`,
      'oauth_popup',
      'width=520,height=640,scrollbars=yes,resizable=yes'
    );
    const handler = (e) => {
      if ((e.data?.type === 'oauth_success' || e.data?.type === 'oauth_error') && e.data.provider === provider) {
        window.removeEventListener('message', handler);
        onConnect();
      }
    };
    window.addEventListener('message', handler);
    const timer = setInterval(() => { if (popup?.closed) { clearInterval(timer); window.removeEventListener('message', handler); onConnect(); } }, 800);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    await fetch(`${API}/connections/${connector.id}`, { method: 'DELETE' });
    setLoading(false);
    onDisconnect();
  };

  if (!connector) return null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <SmallIcon id={connector.iconId} size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>{connector.name}</h2>
            {connected && conn?.connected_at && (
              <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '2px 0 0' }}>
                Connected {new Date(conn.connected_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {connected && (
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 500 }}>Connected ✓</span>
          )}
          {expired && (
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 500 }}>Expired</span>
          )}
          {(connected || expired) ? (
            <button onClick={handleDisconnect} disabled={loading}
              style={{ padding: '7px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, transition: 'background 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              {loading ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <button onClick={handleConnect}
              style={{ padding: '7px 16px', borderRadius: 10, background: 'var(--btn-bg)', border: '1px solid transparent', color: 'var(--btn-text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.65, marginBottom: 28, maxWidth: 600 }}>
        {connector.description}
      </p>

      {/* Tool permissions */}
      {connector.tools.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>Tool permissions</h3>
          <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: '0 0 18px' }}>
            {connected ? 'These tools are active when Taskbot uses this connector.' : 'These tools will be available once you connect.'}
          </p>

          {['read', 'write'].map(kind => {
            const tools = connector.tools.filter(t => t.kind === kind);
            if (!tools.length) return null;
            return (
              <div key={kind} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', margin: 0 }}>
                    {kind === 'read' ? 'Read-only tools' : 'Write/delete tools'} <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>{tools.length}</span>
                  </p>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 500 }}>Always allowed</span>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  {tools.map((tool, i) => (
                    <div key={tool.name}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'var(--surface)', borderBottom: i < tools.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: 12 }}>{tool.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '1px 0 0' }}>{tool.label}</p>
                      </div>
                      <KindBadge kind={tool.kind} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {connector.tools.length === 0 && (
        <div style={{ padding: '20px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>Tool details coming soon for this connector.</p>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Customize() {
  const [navItem,    setNavItem]    = useState('connectors');
  const [selected,   setSelected]   = useState(CONNECTORS[0].id);
  const [connections, setConns]     = useState([]);

  const refresh = () => {
    fetch(`${API}/connections`)
      .then(r => r.json())
      .then(d => setConns(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => { refresh(); }, []);

  const connectedIds = connections.filter(c => c.status === 'connected' || c.status === 'expired').map(c => c.provider);
  const connectedList    = CONNECTORS.filter(c => connectedIds.includes(c.id));
  const notConnectedList = CONNECTORS.filter(c => !connectedIds.includes(c.id));
  const selectedConnector = CONNECTORS.find(c => c.id === selected);
  const selectedConn      = connections.find(c => c.provider === selected);

  return (
    <div style={{ display: 'flex', flex: 1, height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Column 1 — nav */}
      <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '20px 10px', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 16px 10px', letterSpacing: '-0.02em' }}>Customize</p>

        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 4px 10px' }}>Plugins</p>
        <NavItem label="Skills" disabled />

        <div style={{ height: 12 }} />

        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 4px 10px' }}>Integrations</p>
        <NavItem label="Connectors" active={navItem === 'connectors'} onClick={() => setNavItem('connectors')} />
      </div>

      {/* Column 2 — connector list */}
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 10px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Connectors</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {connectedList.length > 0 && (
            <>
              <SectionLabel>Connected</SectionLabel>
              {connectedList.map(c => (
                <ConnectorItem key={c.id} connector={c} selected={selected === c.id} onClick={() => setSelected(c.id)} />
              ))}
            </>
          )}

          {notConnectedList.length > 0 && (
            <>
              <SectionLabel>Not connected</SectionLabel>
              {notConnectedList.map(c => (
                <ConnectorItem key={c.id} connector={c} selected={selected === c.id} onClick={() => setSelected(c.id)} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Column 3 — detail */}
      {selectedConnector && (
        <DetailPanel
          key={selectedConnector.id}
          connector={selectedConnector}
          conn={selectedConn}
          onConnect={refresh}
          onDisconnect={refresh}
        />
      )}
    </div>
  );
}
