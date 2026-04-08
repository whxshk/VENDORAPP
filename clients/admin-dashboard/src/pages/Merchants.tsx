import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MoreVertical, Power, Eye, Store, Building2, MapPin } from 'lucide-react';
import { listMerchants, createMerchant, updateMerchantStatus, type Merchant } from '../api/merchants';
import {
  Button, Badge, Card, Input, Modal, SectionHeader, Spinner, EmptyState,
} from '../components/ui';

const CATEGORY_ICONS: Record<string, string> = {
  cafe: '☕', restaurant: '🍱', fitness: '💪', beauty: '💄',
  retail: '🛍️', grocery: '🛒', entertainment: '🎮', other: '🏪',
};

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'green' : 'red'}>
      {isActive ? 'Active' : 'Suspended'}
    </Badge>
  );
}

function CreateMerchantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', category: 'cafe', address: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    setLoading(true);
    try {
      await createMerchant(form);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create merchant');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', options?: string[]) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {options ? (
        <select
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
        >
          {options.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field('name', 'Business Name')}
      {field('email', 'Contact Email', 'email')}
      {field('category', 'Category', 'text', ['cafe', 'restaurant', 'fitness', 'beauty', 'retail', 'grocery', 'entertainment', 'other'])}
      {field('address', 'Address')}
      {field('phone', 'Phone')}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" variant="primary" loading={loading} className="flex-1">Create Merchant</Button>
      </div>
    </form>
  );
}

export default function Merchants() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await listMerchants();
    setMerchants(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggleStatus = async (m: Merchant) => {
    setTogglingId(m.id);
    setOpenMenuId(null);
    await updateMerchantStatus(m.id, !m.isActive);
    setMerchants((prev) => prev.map((x) => x.id === m.id ? { ...x, isActive: !x.isActive } : x));
    setTogglingId(null);
  };

  const categories = ['all', ...Array.from(new Set(merchants.map((m) => m.category)))];

  const filtered = merchants.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.address.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? m.isActive : !m.isActive);
    const matchCat = filterCategory === 'all' || m.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Merchant Management"
        subtitle={`${merchants.length} merchants on the platform`}
        action={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Merchant
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchants…"
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Store className="h-7 w-7" />} title="No merchants found" subtitle="Try adjusting your search or filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Merchant', 'Category', 'Location', 'Customers', 'Transactions', 'Status', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-white/3 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: 'var(--bg-surface-3)' }}>
                          {m.logoUrl ? <img src={m.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : (CATEGORY_ICONS[m.category] || '🏪')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{m.name}</p>
                          <p className="text-xs text-slate-600">{m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs text-slate-400 capitalize">{m.category}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{m.city || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-semibold text-slate-300 tabular-nums">{m.totalCustomers.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-semibold text-slate-300 tabular-nums">{m.totalTransactions.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge isActive={m.isActive} />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="relative flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/merchants/${m.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                        >
                          {togglingId === m.id ? <Spinner size="sm" /> : <MoreVertical className="h-3.5 w-3.5" />}
                        </Button>

                        {openMenuId === m.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                            <div
                              className="absolute right-0 top-8 w-44 rounded-xl border z-40 overflow-hidden shadow-2xl"
                              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-strong)' }}
                            >
                              <button
                                onClick={() => { navigate(`/merchants/${m.id}`); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-300 hover:bg-white/5 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-500" /> View Details
                              </button>
                              <button
                                onClick={() => { navigate(`/merchants/${m.id}?edit=1`); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-300 hover:bg-white/5 transition-colors"
                              >
                                <Building2 className="h-3.5 w-3.5 text-slate-500" /> Edit Settings
                              </button>
                              <div style={{ borderTop: '1px solid var(--border)' }} />
                              <button
                                onClick={() => handleToggleStatus(m)}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors ${m.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                              >
                                <Power className="h-3.5 w-3.5" />
                                {m.isActive ? 'Suspend Merchant' : 'Activate Merchant'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 text-xs text-slate-600" style={{ borderTop: '1px solid var(--border)' }}>
            Showing {filtered.length} of {merchants.length} merchants
          </div>
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Onboard New Merchant">
        <CreateMerchantModal onClose={() => setShowCreate(false)} onCreated={load} />
      </Modal>
    </div>
  );
}
