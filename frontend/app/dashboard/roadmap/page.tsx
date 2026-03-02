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
  RefreshCw
} from 'lucide-react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { roadmap, features as featuresApi } from '@/lib/api'
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
      const res = await featuresApi.list()
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
    }
  })

  const features = data?.features || []
  const byStatus = data?.byStatus

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: string | null) => {
    if (newView !== null) {
      setView(newView as 'list' | 'kanban')
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Roadmap
          </h1>
          <p className="mt-2 text-slate-500">
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
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <TextField
            placeholder="Search features..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            size="small"
            className="flex-1 min-w-[200px] max-w-md"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="w-5 h-5 text-slate-400" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.75rem',
                '&.Mui-focused fieldset': {
                  borderColor: '#004549',
                },
              },
            }}
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              sx={{
                borderRadius: '0.75rem',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#004549',
                },
              }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={filters.sort}
              label="Sort by"
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              sx={{
                borderRadius: '0.75rem',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#004549',
                },
              }}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* View Toggle */}
          <ToggleButtonGroup
            value={currentView}
            exclusive
            onChange={handleViewChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: '0.5rem',
                padding: '8px',
                '&.Mui-selected': {
                  backgroundColor: '#004549',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#006f77',
                  },
                },
              },
            }}
          >
            <ToggleButton value="list">
              <LayoutList className="w-5 h-5" />
            </ToggleButton>
            <ToggleButton value="kanban">
              <LayoutGrid className="w-5 h-5" />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-aqua-900 border-t-transparent rounded-full" />
        </div>
      ) : currentView === 'kanban' && byStatus ? (
        // Kanban View
        <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
          {['discovered', 'planned', 'in_progress', 'shipped', 'declined'].map((status) => {
            const statusColors: Record<string, string> = {
              discovered: 'bg-slate-100 text-slate-700',
              planned: 'bg-blue-100 text-blue-700',
              in_progress: 'bg-amber-100 text-amber-700',
              shipped: 'bg-emerald-100 text-emerald-700',
              declined: 'bg-red-100 text-red-700',
            }
            return (
              <div key={status} className="min-w-[280px]">
                <div className={`${statusColors[status]} p-3 mb-3 rounded-xl flex items-center justify-between`}>
                  <h3 className="font-semibold text-sm capitalize">
                    {status.replace('_', ' ')}
                  </h3>
                  <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
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
            )
          })}
        </div>
      ) : (
        // List View
        <div className="grid gap-4">
          {features.length > 0 ? (
            features.map((feature: any, index: number) => (
              <FeatureCard 
                key={feature.id} 
                feature={feature} 
                index={index}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Filter className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="font-display text-xl font-semibold text-slate-900 mb-2">
                No Features Found
              </h3>
              <p className="text-slate-600 mb-6">
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
