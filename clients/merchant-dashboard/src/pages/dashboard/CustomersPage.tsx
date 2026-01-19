import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useCustomers, useCustomer } from '../../hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { Customer } from '../../api/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading } = useCustomers({ page, limit: 20, search });

  const { data: customerDetail } = useCustomer(selectedCustomerId || '');

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-semibold text-white">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'qrCode',
      header: 'QR Code',
      cell: ({ row }) => <div className="text-slate-400 font-mono text-sm">{row.getValue('qrCode')}</div>,
    },
    {
      accessorKey: 'pointsBalance',
      header: 'Points Balance',
      cell: ({ row }) => (
        <div className="font-bold text-blue-400">{row.getValue('pointsBalance')}</div>
      ),
    },
    {
      accessorKey: 'lastVisit',
      header: 'Last Visit',
      cell: ({ row }) => <div className="text-slate-400">{formatDate(row.getValue('lastVisit'))}</div>,
    },
    {
      accessorKey: 'totalVisits',
      header: 'Total Visits',
      cell: ({ row }) => <div className="text-white">{row.getValue('totalVisits')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('status') === 'active' ? 'success' : 'secondary'}>
          {row.getValue('status')}
        </Badge>
      ),
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
    pageCount: data ? Math.ceil(data.total / 20) : 0,
    state: {
      globalFilter: search,
    },
  });

  const handleRowClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
          <p className="text-slate-400">Manage your customer base</p>
        </div>
        <div className="text-center py-12 text-slate-400">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
        <p className="text-slate-400">Manage your customer base</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Customers</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data?.data.length === 0 ? (
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
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => handleRowClick(row.original.id)}
                        className="hover:bg-white/5 cursor-pointer transition-colors duration-150"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-4 px-6 text-sm">
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
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data?.total || 0)} of {data?.total || 0} customers
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data || page * 20 >= data.total}
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
            <DialogTitle>{customerDetail?.name}</DialogTitle>
            <DialogClose onClose={() => setIsDetailOpen(false)} />
          </DialogHeader>
          {customerDetail && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <div className="text-sm text-slate-400 mb-1">Points Balance</div>
                  <div className="text-3xl font-bold text-blue-400">{customerDetail.pointsBalance}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <div className="text-sm text-slate-400 mb-1">Total Visits</div>
                  <div className="text-3xl font-bold text-white">{customerDetail.totalVisits}</div>
                </div>
              </div>

              {/* Points History Chart */}
              {customerDetail.pointsHistory && customerDetail.pointsHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Points History (Last 30 Days)</h3>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={customerDetail.pointsHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                        <YAxis stroke="rgba(255,255,255,0.4)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Points</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {customerDetail.transactions.slice(0, 10).map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-sm text-slate-400">{formatDate(tx.timestamp)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={tx.type === 'earn' ? 'success' : 'destructive'}>
                              {tx.type === 'earn' ? 'Earn' : 'Redeem'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-semibold">
                            <span className={tx.points > 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {tx.points > 0 ? '+' : ''}
                              {tx.points}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-400">{tx.staffName}</td>
                        </tr>
                      ))}
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
