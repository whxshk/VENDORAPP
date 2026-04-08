import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Eye, Circle } from 'lucide-react';
import { searchCustomers, type Customer } from '../api/customers';
import { Button, Badge, Card, SectionHeader, Spinner, EmptyState } from '../components/ui';
import { format } from 'date-fns';

export default function Customers() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = (q: string) => {
    setLoading(true);
    searchCustomers(q).then((res) => {
      setCustomers(res);
      setLoading(false);
    });
  };

  useEffect(() => { doSearch(''); }, []);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(q), 300);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Customer Management"
        subtitle="Search and inspect any customer's platform activity"
      />

      {/* Search bar */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by name, email, phone, or SharkBand ID…"
          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
        />
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : customers.length === 0 ? (
          <EmptyState icon={<Users className="h-7 w-7" />} title="No customers found" subtitle={query ? 'Try a different search term' : 'No customers registered yet'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Customer', 'SharkBand ID', 'Merchants', 'Points', 'Transactions', 'Last Active', 'Status', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-white/3 transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #d946ef, #9333ea)' }}>
                          {c.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{c.name}</p>
                          <p className="text-xs text-slate-600">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <code className="text-xs text-admin-400 bg-admin-500/10 px-2 py-0.5 rounded">{c.sharkbandId}</code>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-semibold text-slate-300 tabular-nums">{c.merchantsVisited.length}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-semibold text-emerald-400 tabular-nums">{c.totalPoints.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-semibold text-slate-300 tabular-nums">{c.totalTransactions}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs text-slate-500">
                        {format(new Date(c.lastSeen), 'MMM d, HH:mm')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={c.isActive ? 'green' : 'red'}>
                        {c.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${c.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && customers.length > 0 && (
          <div className="px-5 py-3 text-xs text-slate-600" style={{ borderTop: '1px solid var(--border)' }}>
            {customers.length} {query ? 'results' : 'customers total'}
          </div>
        )}
      </Card>
    </div>
  );
}
