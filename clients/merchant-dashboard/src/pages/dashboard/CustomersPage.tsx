import { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useCustomers, useCustomer, useAdjustBalance } from '../../hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate, toNumber } from '../../lib/utils';
import type { Customer } from '../../api/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ── helpers ──────────────────────────────────────────────────────────────────

function balanceLabel(balance: number, loyaltyType?: string) {
  const isStamps = loyaltyType?.toLowerCase() === 'stamps';
  return isStamps ? `${balance} stamps` : `${balance} pts`;
}

function BalanceBadge({ balance, loyaltyType, stampsRequired }: { balance: number; loyaltyType?: string; stampsRequired?: number }) {
  const isStamps = loyaltyType?.toLowerCase() === 'stamps';
  if (isStamps) {
    return (
      <span className="font-bold text-orange-400">
        {balance}<span className="text-slate-500 text-xs font-normal ml-1">/ {stampsRequired ?? '?'} stamps</span>
      </span>
    );
  }
  return <span className="font-bold text-blue-400">{balance} <span className="text-xs font-normal text-slate-400">pts</span></span>;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

  // Adjust form state
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const adjustBalanceMutation = useAdjustBalance();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useCustomers({ page, limit: 20, search });
  const totalCustomers = toNumber(data?.total);

  // Loyalty type from list response
  const loyaltyType = (data as any)?.loyaltyType as string | undefined;
  const stampsRequired = (data as any)?.stampsRequired as number | undefined;
  const isStamps = loyaltyType?.toLowerCase() === 'stamps';

  const { data: customerDetail, refetch: refetchDetail } = useCustomer(selectedCustomerId || '');

  // Use detail's loyaltyType if available (authoritative), fallback to list
  const detailLoyaltyType = customerDetail?.loyaltyType ?? loyaltyType;
  const detailStampsRequired = customerDetail?.stampsRequired ?? stampsRequired;
  const detailIsStamps = detailLoyaltyType?.toLowerCase() === 'stamps';

  const handleAdjust = () => {
    if (!selectedCustomerId) return;
    const delta = parseFloat(adjustDelta);
    if (isNaN(delta) || delta === 0) {
      setAdjustError('Enter a non-zero number (e.g. +3 or -2)');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('Reason is required');
      return;
    }
    setAdjustError(null);
    setAdjustSuccess(null);
    adjustBalanceMutation.mutate(
      { id: selectedCustomerId, delta, reason: adjustReason.trim() },
      {
        onSuccess: (res) => {
          setAdjustSuccess(
            `Done! New balance: ${balanceLabel(res.newBalance, detailLoyaltyType)}`
          );
          setAdjustDelta('');
          setAdjustReason('');
          refetchDetail();
        },
        onError: (err: any) => {
          setAdjustError(
            err?.response?.data?.message || err?.message || 'Adjustment failed'
          );
        },
      }
    );
  };

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
        >
          Name
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="font-semibold text-white">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'shortId',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
        >
          Customer ID
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-blue-400 font-mono text-sm font-semibold" title={row.original.id}>
          {(row.original as any).shortId || '0000'}
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = (rowA.original as any).shortId || '0000';
        const b = (rowB.original as any).shortId || '0000';
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      },
    },
    {
      accessorKey: 'pointsBalance',
      id: 'points',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
        >
          Points
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const bal = toNumber(row.getValue('pointsBalance') ?? (row.original as any).pointsBalance);
        return isStamps
          ? <span className="text-slate-600 text-sm">—</span>
          : <span className="font-bold text-blue-400">{bal} <span className="text-xs font-normal text-slate-400">pts</span></span>;
      },
    },
    {
      id: 'stamps',
      accessorFn: (row) => row.pointsBalance,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
        >
          Stamps
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const bal = toNumber(row.original.pointsBalance);
        return !isStamps
          ? <span className="text-slate-600 text-sm">—</span>
          : (
            <span className="font-bold text-orange-400">
              {bal}
              <span className="text-slate-500 text-xs font-normal ml-1">/ {stampsRequired ?? '?'}</span>
            </span>
          );
      },
    },
    {
      accessorKey: 'lastVisit',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
        >
          Last Visit
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('lastVisit');
        return (
          <div className="text-slate-400">
            {date && (typeof date === 'string' || date instanceof Date)
              ? formatDate(date as string | Date)
              : 'Never'}
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.getValue('lastVisit') as Date | string | null;
        const b = rowB.getValue('lastVisit') as Date | string | null;
        return (a ? new Date(a).getTime() : 0) - (b ? new Date(b).getTime() : 0);
      },
    },
    {
      accessorKey: 'totalVisits',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
        >
          Total Visits
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="text-white">{toNumber(row.getValue('totalVisits'))}</div>,
    },
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(totalCustomers / 20) : 0,
    state: { globalFilter: search, sorting },
    onSortingChange: setSorting,
  });

  const handleRowClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsDetailOpen(true);
    setAdjustDelta('');
    setAdjustReason('');
    setAdjustSuccess(null);
    setAdjustError(null);
  };

  const showInitialLoading = isLoading && !data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
        <p className="text-slate-400">Manage your customer base</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              All Customers
              {isLoading && data && (
                <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or ID (e.g., 0001)…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showInitialLoading ? (
            <div className="text-center py-12 text-slate-400">Loading customers…</div>
          ) : isError ? (
            <div className="text-center py-12 text-red-400">
              Unable to load customers. Please try again later.
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No customers found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b border-white/10">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.id}
                        onClick={() => handleRowClick(row.original.id)}
                        className="group hover:bg-gradient-to-r hover:from-blue-500/10 hover:via-purple-500/5 hover:to-transparent cursor-pointer transition-all duration-300 ease-out hover:shadow-lg hover:shadow-blue-500/5"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="py-4 px-6 text-sm transition-transform duration-300 group-hover:translate-x-1"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <div className="text-sm text-slate-400">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalCustomers)} of{' '}
                  {totalCustomers} customers
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data || page * 20 >= totalCustomers}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{customerDetail?.name}</DialogTitle>
            {customerDetail && (customerDetail as any).shortId && (
              <p className="text-sm text-slate-400 mt-1">
                Customer ID:{' '}
                <span className="font-mono font-semibold text-blue-400">
                  {(customerDetail as any).shortId}
                </span>
              </p>
            )}
            <DialogClose onClose={() => setIsDetailOpen(false)} />
          </DialogHeader>

          {customerDetail && (
            <div className="space-y-6 mt-4">

              {/* ── Balance + Visits ─────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    detailIsStamps
                      ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30'
                      : 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30'
                  }`}
                >
                  <div className="text-sm text-slate-300 mb-1">
                    {detailIsStamps ? 'Stamps' : 'Points'} Balance
                  </div>
                  {detailIsStamps ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-orange-400">
                        {toNumber(customerDetail.pointsBalance)}
                      </span>
                      <span className="text-slate-400 text-sm">
                        / {detailStampsRequired ?? '?'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-blue-400">
                      {toNumber(customerDetail.pointsBalance)}{' '}
                      <span className="text-base font-normal text-slate-400">pts</span>
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                  <div className="text-sm text-slate-300 mb-1">Total Visits</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {customerDetail.totalVisits}
                  </div>
                </div>
              </div>

              {/* ── Contact ──────────────────────────────────────── */}
              {(customerDetail.email || customerDetail.phone) && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    {customerDetail.email && (
                      <div className="text-slate-400">
                        <span className="font-semibold text-slate-300">Email:</span>{' '}
                        {customerDetail.email}
                      </div>
                    )}
                    {customerDetail.phone && (
                      <div className="text-slate-400">
                        <span className="font-semibold text-slate-300">Phone:</span>{' '}
                        {customerDetail.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Adjust Balance ───────────────────────────────── */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                  Adjust Balance
                  <span className="text-xs text-slate-500 font-normal">— fix mistakes</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      Amount (use − to remove)
                    </label>
                    <Input
                      type="number"
                      value={adjustDelta}
                      onChange={(e) => { setAdjustDelta(e.target.value); setAdjustError(null); setAdjustSuccess(null); }}
                      placeholder={detailIsStamps ? 'e.g. +1 or -2 stamps' : 'e.g. +10 or -5 pts'}
                      className="font-mono"
                    />
                    {adjustDelta && !isNaN(parseFloat(adjustDelta)) && (
                      <p className="text-xs mt-1 text-slate-400">
                        Preview:{' '}
                        <span className={parseFloat(adjustDelta) > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {balanceLabel(
                            Math.max(0, toNumber(customerDetail.pointsBalance) + parseFloat(adjustDelta)),
                            detailLoyaltyType,
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Reason (required)</label>
                    <Input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => { setAdjustReason(e.target.value); setAdjustError(null); setAdjustSuccess(null); }}
                      placeholder="e.g. Stamp given by mistake"
                    />
                  </div>
                </div>

                {adjustError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                    {adjustError}
                  </div>
                )}
                {adjustSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {adjustSuccess}
                  </div>
                )}

                <Button
                  onClick={handleAdjust}
                  disabled={
                    adjustBalanceMutation.isPending ||
                    !adjustDelta ||
                    isNaN(parseFloat(adjustDelta)) ||
                    parseFloat(adjustDelta) === 0 ||
                    !adjustReason.trim()
                  }
                  size="sm"
                  className="w-full"
                >
                  {adjustBalanceMutation.isPending ? 'Applying…' : 'Apply Adjustment'}
                </Button>
              </div>

              {/* ── Balance History Chart ─────────────────────────── */}
              {customerDetail.pointsHistory && customerDetail.pointsHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">
                    {detailIsStamps ? 'Stamps' : 'Points'} History (Last 30 Days)
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={customerDetail.pointsHistory.map((item) => ({
                          ...item,
                          date: formatDate(item.date),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          dataKey="date"
                          stroke="rgba(255,255,255,0.4)"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="rgba(255,255,255,0.4)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: `1px solid ${detailIsStamps ? 'rgba(249,115,22,0.3)' : 'rgba(59,130,246,0.3)'}`,
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke={detailIsStamps ? '#f97316' : '#3b82f6'}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Transaction History ───────────────────────────── */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {detailIsStamps ? 'Stamps' : 'Points'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {customerDetail.transactions.slice(0, 10).map((tx) => {
                        const isAdj = (tx as any).isAdjustment;
                        const isStampTx = (tx as any).stampIssued;
                        return (
                          <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-sm text-slate-400">
                              {formatDate(tx.timestamp)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant={tx.type === 'earn' ? 'success' : 'destructive'}>
                                  {tx.type === 'earn'
                                    ? isStampTx
                                      ? 'Stamp'
                                      : 'Points'
                                    : 'Redeem'}
                                </Badge>
                                {isAdj && (
                                  <span className="text-xs text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded font-medium">
                                    Adj
                                  </span>
                                )}
                                {isAdj && (tx as any).adjustmentReason && (
                                  <span className="text-xs text-slate-500 italic">
                                    {(tx as any).adjustmentReason}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold">
                              <span
                                className={
                                  toNumber(tx.points) > 0 ? 'text-emerald-400' : 'text-red-400'
                                }
                              >
                                {toNumber(tx.points) > 0 ? '+' : ''}
                                {toNumber(tx.points)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
