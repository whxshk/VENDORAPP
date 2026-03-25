import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useTransactions } from '../../hooks/useTransactions';
import { useMerchantSettings } from '../../hooks/useMerchant';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Download, X, MapPin, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Stamp } from 'lucide-react';
import { formatDateTime, toNumber } from '../../lib/utils';
import type { Transaction } from '../../api/types';

function TypePill({ type, stampIssued }: { type: string; stampIssued?: boolean }) {
  if (stampIssued) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
      >
        <Stamp className="h-3 w-3" />Stamp
      </span>
    );
  }
  if (type === 'earn') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}
      >
        <ArrowUpRight className="h-3 w-3" />Earn
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}
    >
      <ArrowDownRight className="h-3 w-3" />Redeem
    </span>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
    >
      {initial}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer select-none"
      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
      onClick={onRemove}
    >
      {label}
      <X className="h-3 w-3 opacity-70" />
    </span>
  );
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationId, setLocationId] = useState('');
  const [type, setType] = useState<'earn' | 'redeem' | ''>('');

  const { data: transactionsData, isLoading, isError } = useTransactions({
    page,
    limit: 20,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    locationId: locationId || undefined,
    type: type || undefined,
  });

  const { data: merchant } = useMerchantSettings();
  const locations = merchant?.branches || [];
  const totalTransactions = toNumber(transactionsData?.total);
  const pageCount = transactionsData ? Math.ceil(totalTransactions / 20) : 0;
  const hasFilters = !!(startDate || endDate || locationId || type);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <CustomerAvatar name={row.getValue('customerName')} />
          <span className="text-sm font-medium text-white">{row.getValue('customerName')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const isStamp = (row.original as any).stampIssued === true;
        return <TypePill type={row.getValue('type')} stampIssued={isStamp} />;
      },
    },
    {
      accessorKey: 'points',
      header: 'Amount',
      cell: ({ row }) => {
        const points = toNumber(row.getValue('points'));
        const isStamp = (row.original as any).stampIssued === true;
        const color = points > 0 ? (isStamp ? 'text-amber-400' : 'text-emerald-400') : 'text-red-400';
        return (
          <span className={`text-sm font-bold tabular-nums ${color}`}>
            {points > 0 ? '+' : ''}{points}
            {isStamp ? ` stamp${Math.abs(points) !== 1 ? 's' : ''}` : ' pts'}
          </span>
        );
      },
    },
    {
      accessorKey: 'branchName',
      header: 'Location',
      cell: ({ row }) => {
        const branchName = row.getValue('branchName') as string;
        return (
          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
            <MapPin className={`h-3.5 w-3.5 flex-shrink-0 ${branchName ? 'text-blue-400' : 'text-slate-600'}`} />
            {branchName || <span className="text-slate-600">—</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 tabular-nums">{formatDateTime(row.getValue('timestamp'))}</span>
      ),
    },
  ];

  const table = useReactTable({
    data: transactionsData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const handleExportCSV = () => {
    if (!transactionsData?.data) return;
    const headers = ['Date', 'Customer', 'Type', 'Points', 'Location'];
    const rows = (transactionsData.data as Transaction[]).map((tx) => [
      formatDateTime(tx.timestamp),
      tx.customerName,
      tx.type,
      toNumber(tx.points).toString(),
      tx.branchName || '-',
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setLocationId('');
    setType('');
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-7">
        <div className="h-8 w-48 rounded-lg bg-slate-800 animate-pulse" />
        <div className="h-20 rounded-xl bg-slate-800/40 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-7">
        <PageHeader title="Transactions" subtitle="View and filter all transaction history" />
        <div
          className="rounded-xl p-8 text-center text-red-400 text-sm"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}
        >
          Unable to load transactions. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* Page Header */}
      <PageHeader title="Transactions" subtitle="View and filter all transaction history">
        <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Section rule */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* Filter Toolbar */}
      <div
        className="rounded-xl px-5 py-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full h-9 rounded-lg border border-white/10 bg-slate-800/50 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full h-9 rounded-lg border border-white/10 bg-slate-800/50 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Location</label>
            <Select
              value={locationId}
              onChange={(e) => { setLocationId(e.target.value); setPage(1); }}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Type</label>
            <Select
              value={type}
              onChange={(e) => { setType(e.target.value as 'earn' | 'redeem' | ''); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="earn">Earn</option>
              <option value="redeem">Redeem</option>
            </Select>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Active:</span>
            {startDate && <FilterChip label={`From ${startDate}`} onRemove={() => { setStartDate(''); setPage(1); }} />}
            {endDate && <FilterChip label={`To ${endDate}`} onRemove={() => { setEndDate(''); setPage(1); }} />}
            {locationId && (
              <FilterChip
                label={locations.find(l => l.id === locationId)?.name || 'Location'}
                onRemove={() => { setLocationId(''); setPage(1); }}
              />
            )}
            {type && <FilterChip label={type === 'earn' ? 'Earn' : 'Redeem'} onRemove={() => { setType(''); setPage(1); }} />}
            <button
              onClick={clearFilters}
              className="text-[11px] text-slate-500 hover:text-slate-300 ml-1 underline underline-offset-2 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <h2 className="text-sm font-semibold text-white">All Transactions</h2>
              <p className="text-xs text-slate-500 mt-0.5">{totalTransactions} total records</p>
            </div>
          </div>

          {!transactionsData?.data.length ? (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-500">No transactions found</p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-blue-400 hover:text-blue-300 mt-2 underline underline-offset-2 transition-colors">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="text-left py-3 px-6 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: index < table.getRowModel().rows.length - 1
                            ? '1px solid rgba(255,255,255,0.03)'
                            : 'none',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.025)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-3.5 px-6 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-xs text-slate-500 tabular-nums">
                  Showing{' '}
                  <span className="text-slate-300 font-semibold">{((page - 1) * 20) + 1}</span>
                  {' '}–{' '}
                  <span className="text-slate-300 font-semibold">{Math.min(page * 20, totalTransactions)}</span>
                  {' '}of{' '}
                  <span className="text-slate-300 font-semibold">{totalTransactions}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span
                    className="px-3 h-8 rounded-lg flex items-center text-xs font-semibold tabular-nums"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
                  >
                    {page} / {pageCount || 1}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!transactionsData || page * 20 >= totalTransactions}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
