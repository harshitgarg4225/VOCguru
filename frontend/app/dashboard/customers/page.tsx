'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Search, 
  RefreshCw, 
  DollarSign,
  Mail,
  Building,
  CreditCard,
  Clock
} from 'lucide-react'
import { customers } from '@/lib/api'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', { search, page }],
    queryFn: async () => {
      const res = await customers.list({ search: search || undefined, page, limit: 20 })
      return res.data.data
    }
  })

  // Sync all mutation
  const syncAllMutation = useMutation({
    mutationFn: () => customers.syncAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const customerList = data?.customers || []
  const total = data?.total || 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-oswald text-4xl font-bold uppercase tracking-wide">
            Customers
          </h1>
          <p className="mt-2 text-gray-600">
            {total} customers • Enriched from Stripe
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => syncAllMutation.mutate()}
          isLoading={syncAllMutation.isPending}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Sync All from Stripe
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white border-2 border-ink p-4 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name, or company..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-wine-900 border-t-transparent rounded-full" />
        </div>
      ) : customerList.length > 0 ? (
        <div className="bg-white border-2 border-ink overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-ink">
              <tr>
                <th className="px-6 py-4 text-left font-oswald font-semibold uppercase text-sm">
                  Customer
                </th>
                <th className="px-6 py-4 text-left font-oswald font-semibold uppercase text-sm">
                  Plan
                </th>
                <th className="px-6 py-4 text-right font-oswald font-semibold uppercase text-sm">
                  ARR
                </th>
                <th className="px-6 py-4 text-right font-oswald font-semibold uppercase text-sm">
                  Last Synced
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerList.map((customer: any, index: number) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-wine-100 rounded-full flex items-center justify-center">
                        <span className="font-oswald font-bold text-wine-900">
                          {(customer.name || customer.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name || 'No name'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </p>
                        {customer.company_name && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {customer.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-wine-50 text-wine-900 text-sm font-medium">
                      <CreditCard className="w-3 h-3" />
                      {customer.plan_name || 'Free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {customer.arr > 0 ? (
                      <span className="revenue-badge">
                        {formatCurrency(customer.arr)}
                      </span>
                    ) : (
                      <span className="text-gray-400">$0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    <span className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {customer.last_synced_at ? timeAgo(customer.last_synced_at) : 'Never'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {total > 20 && (
            <div className="px-6 py-4 border-t-2 border-ink flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-ink p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-oswald text-xl font-semibold uppercase mb-2">
            No Customers Found
          </h3>
          <p className="text-gray-600 mb-6">
            {search 
              ? 'Try adjusting your search'
              : 'Connect Stripe and start collecting feedback to see customers'}
          </p>
          {!search && (
            <Button
              onClick={() => syncAllMutation.mutate()}
              isLoading={syncAllMutation.isPending}
            >
              Sync from Stripe
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

