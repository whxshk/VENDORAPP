import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Wrench, CheckCircle2 } from 'lucide-react';
import { getCustomer, getCustomerAuditTrail, type CustomerDetail as Customer } from '../api/customers';
import { Button, Badge, Card, SectionHeader, StatCard, Spinner } from '../components/ui';
import { format } from 'date-fns';

type AuditTx = Awaited<ReturnType<typeof getCustomerAuditTrail>>[number];

const TX_TYPE_STYLES = {
  earn:       { icon: ArrowUpRight,    color: '#34d399', bg: 'rgba(52,211,153,0.1)',  label: 'Earn' },
  redeem:     { icon: ArrowDownRight,  color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Redeem' },
  adjustment: { icon: Wrench,          color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'Adj.' },
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [trail, setTrail] = useState<AuditTx[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterMerchant, setFilterMerchant] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!id) return;
    Promise.all([getCustomer(id), getCustomerAuditTrail(id)])
      .then(([c, t]) => { setCustomer(c); setTrail(t); })
      .catch(() => navigate('/customers'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;
  if (!customer) return null;

  const merchants = Array.from(new Set(trail.map((t) => t.merchantId))).map((mid) => ({
    id: mid, name: trail.find((t) => t.merchantId === mid)?.merchantName || mid,
  }));

  const filtered = trail.filter((t) => {
    const matchMerchant = filterMerchant === 'all' || t.merchantId === filterMerchant;
    const matchType = filterType === 'all' || t.type === filterType;
    return matchMerchant && matchType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/customers')} className="mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <SectionHeader
          title={customer.name}
          subtitle={customer.email}
          action={
            <Badge variant={customer.isActive ? 'green' : 'red'}>
              {customer.isActive ? 'Active' : 'Suspended'}
            </Badge>
          }
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Current Points" value={customer.totalPoints.toLocaleString()} icon={<ArrowUpRight className="h-5 w-5" />} color="green" />
        <StatCard title="Total Transactions" value={customer.totalTransactions} icon={<ArrowDownRight className="h-5 w-5" />} color="blue" />
        <StatCard title="Merchants Visited" value={customer.merchantsVisited.length} icon={<CheckCircle2 className="h-5 w-5" />} color="purple" />
        <div className="rounded-2xl p-5" style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)' }}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SharkBand ID</p>
          <code className="text-sm font-bold text-admin-400">{customer.sharkbandId}</code>
          <p className="text-[10px] text-slate-600 mt-1">Joined {format(new Date(customer.joinedAt), 'MMM d, yyyy')}</p>
        </div>
      </div>

      {/* Cross-Merchant Audit Trail */}
      <Card>
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-sm font-bold text-slate-300">Cross-Merchant Audit Trail</h2>
            <p className="text-xs text-slate-600">{trail.length} transactions across {customer.merchantsVisited.length} merchants</p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterMerchant}
              onChange={(e) => setFilterMerchant(e.target.value)}
              className="h-8 px-2.5 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-1 focus:ring-admin-500/50"
            >
              <option value="all">All Merchants</option>
              {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-8 px-2.5 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-1 focus:ring-admin-500/50"
            >
              <option value="all">All Types</option>
              <option value="earn">Earn</option>
              <option value="redeem">Redeem</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Time', 'Merchant', 'Type', 'Points', 'Branch', 'Staff', 'Note'].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const style = TX_TYPE_STYLES[tx.type as keyof typeof TX_TYPE_STYLES] || TX_TYPE_STYLES.earn;
                const Icon = style.icon;
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 px-5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {format(new Date(tx.timestamp), 'MMM d, HH:mm')}
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-xs font-semibold text-slate-300">{tx.merchantName}</p>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: style.bg, color: style.color }}
                      >
                        <Icon className="h-3 w-3" />
                        {style.label}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: tx.points >= 0 ? '#34d399' : '#f87171' }}
                      >
                        {tx.points >= 0 ? '+' : ''}{tx.points}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-xs text-slate-600">{tx.branchName || '—'}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-xs text-slate-600">{tx.staffName}</span>
                    </td>
                    <td className="py-3 px-5">
                      {tx.isManualAdjustment ? (
                        <span className="text-xs text-amber-400">{tx.adjustmentReason}</span>
                      ) : (
                        <span className="text-xs text-slate-700">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-xs text-slate-600" style={{ borderTop: '1px solid var(--border)' }}>
          Showing {filtered.length} of {trail.length} entries
        </div>
      </Card>

    </div>
  );
}
