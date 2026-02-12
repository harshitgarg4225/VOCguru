'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutList, 
  LayoutGrid, 
  Search, 
  Filter,
  Plus,
  RefreshCw
} from 'lucide-react'
import { roadmap, features as featuresApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { FeatureCard } from '@/components/ui/FeatureCard'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/lib/store'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'discovered', label: 'Discovered' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'declined', label: 'Declined' },
]

const sortOptions = [
  { value: 'total_arr', label: 'Revenue at Risk' },
  { value: 'feedback_count', label: 'Feedback Count' },
  { value: 'urgency_score', label: 'Urgency' },
  { value: 'created_at', label: 'Recently Added' },
]

export default function RoadmapPage() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { currentView, setView } = useUIStore()

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    sort: searchParams.get('sort') || 'total_arr',
    search: '',
  })

  // Fetch features
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['roadmap', filters],
    queryFn: async () => {
      const res = await roadmap.get({
        status: filters.status || undefined,
        sort: filters.sort,
        view: currentView,
        search: filters.search || undefined,
      })
      return res.data.data
    }
  })

  // Reprocess mutation
  const reprocessMutation = useMutation({
    mutationFn: async () => {
      const res = await featuresApi.list() // This would be a reprocess endpoint
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
    }
  })

  const features = data?.features || []
  const byStatus = data?.byStatus

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-oswald text-4xl font-bold uppercase tracking-wide">
            Roadmap
          </h1>
          <p className="mt-2 text-gray-600">
            {data?.total || 0} features • Sorted by {sortOptions.find(s => s.value === filters.sort)?.label}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-2 border-ink p-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search features..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input w-auto"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="input w-auto"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center border-2 border-gray-200">
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-2 transition-colors',
                currentView === 'list' 
                  ? 'bg-wine-900 text-white' 
                  : 'text-gray-400 hover:text-ink'
              )}
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'p-2 transition-colors',
                currentView === 'kanban' 
                  ? 'bg-wine-900 text-white' 
                  : 'text-gray-400 hover:text-ink'
              )}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-wine-900 border-t-transparent rounded-full" />
        </div>
      ) : currentView === 'kanban' && byStatus ? (
        // Kanban View
        <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
          {['discovered', 'planned', 'in_progress', 'shipped', 'declined'].map((status) => (
            <div key={status} className="min-w-[280px]">
              <div className="bg-gray-100 p-3 mb-3 flex items-center justify-between">
                <h3 className="font-oswald font-semibold uppercase text-sm">
                  {status.replace('_', ' ')}
                </h3>
                <span className="text-xs bg-white px-2 py-1 rounded">
                  {byStatus[status]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {(byStatus[status] || []).map((feature: any, index: number) => (
                  <FeatureCard 
                    key={feature.id} 
                    feature={feature} 
                    index={index}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="grid gap-6">
          {features.length > 0 ? (
            features.map((feature: any, index: number) => (
              <FeatureCard 
                key={feature.id} 
                feature={feature} 
                index={index}
              />
            ))
          ) : (
            <div className="bg-white border-2 border-ink p-12 text-center">
              <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-oswald text-xl font-semibold uppercase mb-2">
                No Features Found
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.status 
                  ? 'Try adjusting your filters'
                  : 'Start collecting feedback to discover features'}
              </p>
              {(filters.search || filters.status) && (
                <Button
                  variant="secondary"
                  onClick={() => setFilters({ status: '', sort: 'total_arr', search: '' })}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

