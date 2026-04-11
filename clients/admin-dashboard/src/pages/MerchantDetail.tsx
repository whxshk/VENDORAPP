import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Building2, Users, Receipt, TrendingUp, TrendingDown, Power, Search } from 'lucide-react';
import { getMerchant, getMerchantCustomers, updateMerchantStatus, type Merchant, type MerchantCustomer } from '../api/merchants';
import { Button, Badge, Card, SectionHeader, StatCard, Spinner, EmptyState } from '../components/ui';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSortBy, setCustomerSortBy] = useState<'lastSeen' | 'joinedAt' | 'points' | 'redemption' | 'transactions' | 'name'>('lastSeen');
  const [customerOrder, setCustomerOrder] = useState<'asc' | 'desc'>('desc');
  const [customerStatus, setCustomerStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!id) return;
    getMerchant(id)
      .then((m) => { setMerchant(m); setLoading(false); })
      .catch(() => { navigate('/merchants'); });
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setCustomerLoading(true);

    getMerchantCustomers(id, {
      search: customerSearch || undefined,
      sortBy: customerSortBy,
      order: customerOrder,
      status: customerStatus,
    })
      .then((rows) => {
        if (!cancelled) {
          setCustomers(rows);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCustomerLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, customerSearch, customerSortBy, customerOrder, customerStatus]);

  const handleToggle = async () => {
    if (!merchant) return;
    setToggling(true);
    await updateMerchantStatus(merchant.id, !merchant.isActive);
    setMerchant((m) => m ? { ...m, isActive: !m.isActive } : m);
    setToggling(false);
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;
  if (!merchant) return null;

  const redemptionRate = merchant.pointsIssued > 0
    ? Math.round((merchant.pointsRedeemed / merchant.pointsIssued) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/merchants')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <SectionHeader
          title={merchant.name}
          subtitle={`Tenant ID: ${merchant.id}`}
          action={
            <div className="flex items-center gap-2">
              <Badge variant={merchant.isActive ? 'green' : 'red'}>
                {merchant.isActive ? 'Active' : 'Suspended'}
              </Badge>
              <Button
                variant={merchant.isActive ? 'danger' : 'secondary'}
                size="sm"
                loading={toggling}
                onClick={handleToggle}
              >
                <Power className="h-3.5 w-3.5" />
                {merchant.isActive ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          }
        />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={merchant.totalCustomers} icon={<Users className="h-5 w-5" />} color="blue" />
        <StatCard title="Total Scans" value={merchant.totalTransactions} icon={<Receipt className="h-5 w-5" />} color="green" />
        <StatCard title="Points Issued" value={merchant.pointsIssued.toLocaleString()} icon={<TrendingUp className="h-5 w-5" />} color="amber" />
        <StatCard title="Points Redeemed" value={merchant.pointsRedeemed.toLocaleString()} sub={`${redemptionRate}% rate`} icon={<TrendingDown className="h-5 w-5" />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Details panel */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300">Business Details</h2>

          <div className="space-y-3">
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Category" value={merchant.category} capitalize />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={merchant.address || '—'} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={merchant.phone || '—'} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={merchant.email || '—'} />
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Branches" value={`${merchant.branches}`} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="Staff" value={`${merchant.staffCount} members`} />
          </div>

          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">Member since</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(merchant.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

        </Card>

        {/* 7-day chart */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4">Transaction Activity — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={merchant.chartData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="earn-grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#161e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="total" name="Transactions" stroke="#34d399" strokeWidth={2} fill="url(#earn-grad2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-300">Merchant Customers</h2>
              <p className="text-xs text-slate-500 mt-1">
                Filter and sort this merchant&apos;s customers by points, redemptions, activity, and status.
              </p>
            </div>
            <Badge variant="blue">{customers.length} visible</Badge>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, email, or SharkBand ID…"
                className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
              />
            </div>

            <select
              value={customerSortBy}
              onChange={(e) => setCustomerSortBy(e.target.value as typeof customerSortBy)}
              className="h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
            >
              <option value="lastSeen">Sort: Last Seen</option>
              <option value="transactions">Sort: Transactions</option>
              <option value="points">Sort: Points</option>
              <option value="redemption">Sort: Redemption</option>
              <option value="joinedAt">Sort: Joined</option>
              <option value="name">Sort: Name</option>
            </select>

            <select
              value={customerOrder}
              onChange={(e) => setCustomerOrder(e.target.value as typeof customerOrder)}
              className="h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>

            <select
              value={customerStatus}
              onChange={(e) => setCustomerStatus(e.target.value as typeof customerStatus)}
              className="h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          {customerLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="No merchant customers found"
              subtitle="Try adjusting the search or filters for this merchant."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Customer', 'Points', 'Redeemed', 'Transactions', 'Last Seen', 'Status'].map((heading) => (
                      <th key={heading} className="text-left py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      className="hover:bg-white/3 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="min-w-[220px]">
                          <p className="text-sm font-semibold text-slate-200">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.email}</p>
                          <code className="mt-1 inline-block text-[11px] text-admin-400 bg-admin-500/10 px-2 py-0.5 rounded">
                            {customer.sharkbandId}
                          </code>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-emerald-400 tabular-nums">
                        {customer.totalPoints.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-amber-300 tabular-nums">
                        {customer.totalRedeemed.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-slate-300 tabular-nums">
                        {customer.totalTransactions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {format(new Date(customer.lastSeen), 'MMM d, HH:mm')}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={customer.isActive ? 'green' : 'red'}>
                          {customer.isActive ? 'Active' : customer.membershipStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value, capitalize }: { icon: React.ReactNode; label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-slate-600 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</p>
        <p className={`text-xs text-slate-300 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
