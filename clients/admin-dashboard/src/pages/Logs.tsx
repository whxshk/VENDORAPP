import { Fragment, useEffect, useMemo, useState } from 'react';
import { Download, AlertTriangle, Info, Bug, RefreshCw } from 'lucide-react';
import { listLogs, type SystemLogEntry } from '../api/logs';
import { Button, Card, SectionHeader, Spinner } from '../components/ui';
import { format } from 'date-fns';

type LogLevel = 'info' | 'warn' | 'error';

const LEVEL_STYLES: Record<LogLevel, { color: string; bg: string; icon: typeof Info; label: string }> = {
  info:  { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  icon: Info,          label: 'INFO' },
  warn:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: AlertTriangle, label: 'WARN' },
  error: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: Bug,           label: 'ERROR' },
};

export default function Logs() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listLogs()
      .then((result) => setLogs(result))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const sources = useMemo(() => ['all', ...Array.from(new Set(logs.map((l) => l.source))).sort()], [logs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const matchLevel = levelFilter === 'all' || l.level === levelFilter;
      const matchSource = sourceFilter === 'all' || l.source === sourceFilter;
      const matchSearch = !q || l.message.toLowerCase().includes(q) || l.source.toLowerCase().includes(q);
      return matchLevel && matchSource && matchSearch;
    });
  }, [levelFilter, sourceFilter, search, logs]);

  const counts = useMemo(() => ({
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
  }), [logs]);

  const exportCSV = () => {
    const rows = [
      ['Timestamp', 'Level', 'Source', 'Message'],
      ...filtered.map((l) => [l.timestamp, l.level, l.source, `"${l.message.replace(/"/g, '""')}"`]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharkband-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharkband-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="System Logs"
        subtitle="Aggregated platform events, errors, and audit trail"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={exportJSON}>
              <Download className="h-3.5 w-3.5" /> JSON
            </Button>
          </div>
        }
      />

      {/* Level summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['info', 'warn', 'error'] as LogLevel[]).map((level) => {
          const s = LEVEL_STYLES[level];
          const Icon = s.icon;
          return (
            <button
              key={level}
              onClick={() => setLevelFilter(levelFilter === level ? 'all' : level)}
              className="rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: levelFilter === level ? s.bg : 'var(--bg-surface)',
                border: `1px solid ${levelFilter === level ? s.color + '40' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: s.color }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: s.color }}>{level}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{counts[level]}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">events</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
        >
          {sources.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s}</option>)}
        </select>
      </div>

      {/* Log table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Timestamp', 'Level', 'Source', 'Message'].map((h) => (
                      <th key={h} className="text-left py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider font-sans">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => {
                    const s = LEVEL_STYLES[log.level as LogLevel];
                    const Icon = s.icon;
                    const isExpanded = expandedId === log.id;
                    return (
                      <Fragment key={log.id}>
                        <tr
                          style={{ borderBottom: '1px solid var(--border)' }}
                          className={`transition-colors cursor-pointer ${log.level === 'error' ? 'bg-red-500/3 hover:bg-red-500/8' : 'hover:bg-white/3'}`}
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        >
                          <td className="py-2.5 px-5 text-slate-600 whitespace-nowrap">
                            {format(new Date(log.timestamp), 'MMM d HH:mm:ss')}
                          </td>
                          <td className="py-2.5 px-5">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-sans"
                              style={{ background: s.bg, color: s.color }}
                            >
                              <Icon className="h-2.5 w-2.5" />
                              {s.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-5 text-admin-400 whitespace-nowrap">{log.source}</td>
                          <td className="py-2.5 px-5 text-slate-300">{log.message}</td>
                        </tr>
                        {isExpanded && log.metadata && (
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td colSpan={4} className="px-5 py-3 bg-red-500/5">
                              <pre className="text-[10px] text-red-400 whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 text-xs text-slate-600 font-sans" style={{ borderTop: '1px solid var(--border)' }}>
              Showing {filtered.length} of {logs.length} log entries · Click a row to expand metadata
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
