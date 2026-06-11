import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Zap, Brain, Hash } from 'lucide-react';

function ActivityCalendar({ calendar }) {
  if (!calendar?.length) return null;

  // group into weeks (columns), each week is 7 days
  const weeks = [];
  for (let i = 0; i < calendar.length; i += 7) {
    weeks.push(calendar.slice(i, i + 7));
  }

  const max = Math.max(...calendar.map(d => d.count), 1);

  const cellColor = (count) => {
    if (count === 0) return 'var(--surface2)';
    const intensity = count / max;
    if (intensity < 0.25) return 'rgba(217,119,6,0.25)';
    if (intensity < 0.5)  return 'rgba(217,119,6,0.5)';
    if (intensity < 0.75) return 'rgba(217,119,6,0.75)';
    return 'var(--gold)';
  };

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginTop: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 16, letterSpacing: '-0.01em' }}>Activity</p>
      <div style={{ display: 'flex', gap: 4 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 2, marginRight: 4 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={d} style={{ height: 11, display: 'flex', alignItems: 'center', fontSize: 10, color: i % 2 === 1 ? 'var(--text-sub)' : 'transparent', width: 24, userSelect: 'none' }}>{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display: 'flex', gap: 3, flex: 1, overflowX: 'auto' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) => (
                <div key={di} title={`${day.date}: ${day.count} message${day.count !== 1 ? 's' : ''}`}
                  style={{ width: 11, height: 11, borderRadius: 2, background: cellColor(day.count), transition: 'background 0.15s', cursor: day.count > 0 ? 'default' : 'default', flexShrink: 0 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: v === 0 ? 'var(--surface2)' : `rgba(217,119,6,${v})` }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>More</span>
      </div>
    </div>
  );
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const tip = {
  contentStyle: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' },
  itemStyle: { color: 'var(--text-sub)' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color: 'var(--gold)' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text)' }}>{value?.toLocaleString() ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 20, letterSpacing: '-0.01em' }}>{title}</p>
      {children}
    </div>
  );
}

export default function Analytics({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/analytics/`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <button onClick={onBack}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
            Back
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Analytics</h1>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 2 }}></p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-sub)', fontSize: 14 }}>Loading...</div>
        ) : !data || !data.total ? (
          <div style={{ textAlign: 'center', color: 'var(--text-sub)', paddingTop: 80 }}>No data yet. Start chatting to see analytics.</div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              <StatCard icon={MessageSquare} label="Messages" value={data.total.messages} />
              <StatCard icon={Hash} label="Chats" value={data.total.chats} />
              <StatCard icon={Zap} label="Tokens" value={data.total.tokens} sub="assistant output" />
              <StatCard icon={Brain} label="Memories" value={data.total.memory_cards} />
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <ChartCard title="Messages per day">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.messages_per_day}>
                    <defs>
                      <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CA8A04" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#CA8A04" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip {...tip} />
                    <Area type="monotone" dataKey="count" stroke="#CA8A04" strokeWidth={2} fill="url(#msgGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Tokens used per day">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.tokens_per_day}>
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip {...tip} />
                    <Bar dataKey="tokens" fill="#CA8A04" opacity={0.7} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ActivityCalendar calendar={data.calendar} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              {data.memory_growth?.length > 0 && (
                <ChartCard title="Memory cards over time">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data.memory_growth}>
                      <defs>
                        <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#78350F" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#78350F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip {...tip} />
                      <Area type="monotone" dataKey="total" stroke="#92400E" strokeWidth={2} fill="url(#memGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {data.top_chats?.length > 0 && (
                <ChartCard title="Most active chats">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {data.top_chats.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)', width: 16, flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                          <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(c.msg_count / data.top_chats[0].msg_count) * 100}%`, background: 'var(--gold)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-sub)', flexShrink: 0 }}>{c.msg_count}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
