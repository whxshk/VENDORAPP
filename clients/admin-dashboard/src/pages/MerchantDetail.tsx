import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Building2, Users, Receipt, TrendingUp, TrendingDown, Power } from 'lucide-react';
import { getMerchant, updateMerchantStatus, type Merchant } from '../api/merchants';
import { Button, Badge, Card, SectionHeader, StatCard, Spinner } from '../components/ui';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getMock7DayTransactions } from '../api/mock/data';

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === '1';

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [chartData] = useState(getMock7DayTransactions());

  useEffect(() => {
    if (!id) return;
    getMerchant(id)
      .then((m) => { setMerchant(m); setLoading(false); })
      .catch(() => { navigate('/merchants'); });
  }, [id]);

  const handleToggle = async () => {
    if (!merchant) return;
    setToggling(true);
    await updateMerchantStatus(merchant.id, !merchant.isActive);
    setMerchant((m) => m ? { ...m, isActive: !m.isActive } : m);
    setToggling(false);
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;
  if (!merchant) return null;

  const redemptionRate = Math.round((merchant.pointsRedeemed / merchant.pointsIssued) * 100);

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

          {editMode && (
            <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs text-amber-400 font-semibold">
                ✏️ Edit mode — backend endpoint not yet available. Changes will be mocked.
              </p>
            </div>
          )}
        </Card>

        {/* 7-day chart */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4">Transaction Activity — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
