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
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Download, X, MapPin } from 'lucide-react';
import { formatDateTime, toNumber } from '../../lib/utils';
import type { Transaction } from '../../api/types';

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

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Date',
      cell: ({ row }) => <div className="text-slate-400">{formatDateTime(row.getValue('timestamp'))}</div>,
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => <div className="font-semibold text-white">{row.getValue('customerName')}</div>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const isStamp = (row.original as any).stampIssued === true;
        const type = row.getValue('type');
        return (
          <Badge variant={isStamp ? 'warning' : type === 'earn' ? 'success' : 'destructive'}>
            {isStamp ? 'Stamp' : type === 'earn' ? 'Earn' : 'Redeem'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'points',
      header: 'Points / Stamps',
      cell: ({ row }) => {
        const points = toNumber(row.getValue('points'));
        const isStamp = (row.original as any).stampIssued === true;
        const color = points > 0 ? (isStamp ? 'text-orange-400' : 'text-emerald-400') : 'text-red-400';
        return (
          <div className="text-right font-bold">
            <span className={color}>
              {points > 0 ? '+' : ''}{Math.abs(points)}
              {isStamp ? ` stamp${Math.abs(points) !== 1 ? 's' : ''}` : ''}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'branchName',
      header: 'Location',
      cell: ({ row }) => {
        const branchName = row.getValue('branchName') as string;
        return (
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className={`h-3.5 w-3.5 ${branchName ? 'text-blue-400' : 'text-slate-600'}`} />
            {branchName || '-'}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: transactionsData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: transactionsData ? Math.ceil(totalTransactions / 20) : 0,
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-slate-400">View and filter all transaction history</p>
        </div>
        <div className="text-center py-12 text-slate-400">Loading transactions...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-slate-400">View and filter all transaction history</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-red-400">
              Unable to load transactions. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
        <p className="text-slate-400">View and filter all transaction history</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-11 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-11 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Location</label>
                <Select
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Type</label>
                <Select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as 'earn' | 'redeem' | '');
                    setPage(1);
                  }}
                >
                  <option value="">All Types</option>
                  <option value="earn">Earn</option>
                  <option value="redeem">Redeem</option>
                </Select>
              </div>
            </div>
            {(startDate || endDate || locationId || type) && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setLocationId('');
                    setType('');
                    setPage(1);
                  }}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
                <span className="text-xs text-slate-400">
                  {[startDate && 'Start Date', endDate && 'End Date', locationId && 'Location', type && 'Type'].filter(Boolean).join(', ')} active
                </span>
              </div>
            )}
          </div>

          {transactionsData?.data.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No transactions found</p>
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
                        className="group hover:bg-gradient-to-r hover:from-blue-500/10 hover:via-purple-500/5 hover:to-transparent transition-all duration-300 ease-out hover:shadow-lg hover:shadow-blue-500/5"
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
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalTransactions)} of {totalTransactions} transactions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!transactionsData || page * 20 >= totalTransactions}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
