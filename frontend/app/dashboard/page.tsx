'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Lightbulb, 
  DollarSign, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import Chip from '@mui/material/Chip'
import { roadmap, features } from '@/lib/api'
import { StatsCard } from '@/components/ui/StatsCard'
import { FeatureCardCompact } from '@/components/ui/FeatureCard'

export default function DashboardPage() {
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['roadmap-stats'],
    queryFn: async () => {
      const res = await roadmap.getStats()
      return res.data.data
    }
  })

  // Fetch top features by ARR
  const { data: topFeatures } = useQuery({
    queryKey: ['top-features'],
    queryFn: async () => {
      const res = await features.list({ sort: 'total_arr', order: 'desc', limit: 5 })
      return res.data.data.features
    }
  })

  // Fetch recent feedback
  const { data: recentFeatures } = useQuery({
    queryKey: ['recent-features'],
    queryFn: async () => {
      const res = await features.list({ sort: 'created_at', order: 'desc', limit: 5 })
      return res.data.data.features
    }
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <Chip 
            icon={<Sparkles className="w-4 h-4" />}
            label="AI-Powered" 
            size="small"
            sx={{ 
              backgroundColor: '#e6feff',
              color: '#004549',
              fontWeight: 500,
              '& .MuiChip-icon': {
                color: '#004549',
              }
            }}
          />
        </div>
        <p className="text-slate-500">
          Overview of your product feedback and roadmap
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard
          title="Total Features"
          value={stats?.totalFeatures || 0}
          icon={Lightbulb}
          color="aqua"
          index={0}
        />
        <StatsCard
          title="Revenue at Risk"
          value={stats?.totalARR || 0}
          format="currency"
          icon={DollarSign}
          color="emerald"
          index={1}
        />
        <StatsCard
          title="In Progress"
          value={stats?.byStatus?.in_progress?.count || 0}
          icon={TrendingUp}
          color="amber"
          index={2}
        />
        <StatsCard
          title="Shipped This Month"
          value={stats?.byStatus?.shipped?.count || 0}
          icon={MessageSquare}
          color="blue"
          index={3}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Features by Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Top by Revenue at Risk
            </h2>
            <Link 
              href="/dashboard/roadmap?sort=total_arr"
              className="text-aqua-700 hover:text-aqua-900 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {topFeatures?.length > 0 ? (
              topFeatures.map((feature: any, index: number) => (
                <FeatureCardCompact key={feature.id} feature={feature} index={index} />
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No features yet</p>
                <p className="text-sm mt-1">Submit feedback to get started</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recently Discovered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Recently Discovered
            </h2>
            <Link 
              href="/dashboard/roadmap?sort=created_at"
              className="text-aqua-700 hover:text-aqua-900 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentFeatures?.length > 0 ? (
              recentFeatures.map((feature: any, index: number) => (
                <FeatureCardCompact key={feature.id} feature={feature} index={index} />
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No feedback yet</p>
                <p className="text-sm mt-1">Connect Slack or Zoom to start collecting</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Status Breakdown */}
      {stats?.byStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="mt-8 bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-6">
            Status Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['discovered', 'planned', 'in_progress', 'shipped', 'declined'].map((status) => {
              const data = stats.byStatus[status] || { count: 0, arr: 0 }
              const colors: Record<string, string> = {
                discovered: 'hover:bg-slate-100 hover:border-slate-300',
                planned: 'hover:bg-blue-50 hover:border-blue-200',
                in_progress: 'hover:bg-amber-50 hover:border-amber-200',
                shipped: 'hover:bg-emerald-50 hover:border-emerald-200',
                declined: 'hover:bg-red-50 hover:border-red-200',
              }
              return (
                <Link
                  key={status}
                  href={`/dashboard/roadmap?status=${status}`}
                  className={`p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all text-center ${colors[status]}`}
                >
                  <p className="text-3xl font-display font-bold text-slate-900">{data.count}</p>
                  <p className="text-sm text-slate-500 capitalize mt-1">
                    {status.replace('_', ' ')}
                  </p>
                  {data.arr > 0 && (
                    <p className="text-xs text-aqua-700 mt-1 font-medium">
                      ${(data.arr / 1000).toFixed(0)}k ARR
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
