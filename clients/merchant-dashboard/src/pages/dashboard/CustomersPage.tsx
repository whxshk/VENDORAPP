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
import { useCustomers, useCustomer } from '../../hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate, toNumber } from '../../lib/utils';
import type { Customer } from '../../api/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page on search
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useCustomers({ page, limit: 20, search });

  const { data: customerDetail } = useCustomer(selectedCustomerId || '');

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
          >
            Name
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-semibold text-white">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'shortId',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
          >
            Customer ID
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
          >
            Points Balance
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-bold text-blue-400">{toNumber(row.getValue('pointsBalance'))}</div>
      ),
    },
    {
      accessorKey: 'lastVisit',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
          >
            Last Visit
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue('lastVisit');
        return <div className="text-slate-400">{date && (typeof date === 'string' || date instanceof Date) ? formatDate(date as string | Date) : 'Never'}</div>;
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.getValue('lastVisit') as Date | string | null;
        const b = rowB.getValue('lastVisit') as Date | string | null;
        const aTime = a ? new Date(a).getTime() : 0;
        const bTime = b ? new Date(b).getTime() : 0;
        return aTime - bTime;
      },
    },
    {
      accessorKey: 'totalVisits',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3 hover:bg-slate-700 -ml-2"
          >
            Total Visits
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => <div className="text-white">{row.getValue('totalVisits')}</div>,
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
      sorting,
    },
    onSortingChange: setSorting,
  });

  const handleRowClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsDetailOpen(true);
  };

  // Only show full loading state on initial load (no data yet)
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
                placeholder="Search by name or customer ID (e.g., 0001)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showInitialLoading ? (
            <div className="text-center py-12 text-slate-400">Loading customers...</div>
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
                          <td key={cell.id} className="py-4 px-6 text-sm transition-transform duration-300 group-hover:translate-x-1">
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
            <DialogTitle className="text-2xl font-bold">{customerDetail?.name}</DialogTitle>
            {customerDetail && (customerDetail as any).shortId && (
              <p className="text-sm text-slate-400 mt-1">Customer ID: <span className="font-mono font-semibold text-blue-400">{(customerDetail as any).shortId}</span></p>
            )}
            <DialogClose onClose={() => setIsDetailOpen(false)} />
          </DialogHeader>
          {customerDetail && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                  <div className="text-sm text-slate-300 mb-1">Points Balance</div>
                  <div className="text-3xl font-bold text-blue-400">{toNumber(customerDetail.pointsBalance)}</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                  <div className="text-sm text-slate-300 mb-1">Total Visits</div>
                  <div className="text-3xl font-bold text-purple-400">{customerDetail.totalVisits}</div>
                </div>
              </div>
              
              {/* Customer Info */}
              {(customerDetail.email || customerDetail.phone) && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    {customerDetail.email && (
                      <div className="text-slate-400">
                        <span className="font-semibold text-slate-300">Email:</span> {customerDetail.email}
                      </div>
                    )}
                    {customerDetail.phone && (
                      <div className="text-slate-400">
                        <span className="font-semibold text-slate-300">Phone:</span> {customerDetail.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Points History Chart */}
              {customerDetail.pointsHistory && customerDetail.pointsHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Points History (Last 30 Days)</h3>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={customerDetail.pointsHistory.map(item => ({
                        ...item,
                        date: formatDate(item.date),
                      }))}>
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
                            <span className={toNumber(tx.points) > 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {toNumber(tx.points) > 0 ? '+' : ''}
                              {toNumber(tx.points)}
                            </span>
                          </td>
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
