'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Lightbulb, 
  DollarSign, 
  MessageSquare, 
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
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
        <h1 className="font-oswald text-4xl font-bold uppercase tracking-wide">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Overview of your product feedback and roadmap
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard
          title="Total Features"
          value={stats?.totalFeatures || 0}
          icon={Lightbulb}
          color="wine"
          index={0}
        />
        <StatsCard
          title="Revenue at Risk"
          value={stats?.totalARR || 0}
          format="currency"
          icon={DollarSign}
          color="accent"
          index={1}
        />
        <StatsCard
          title="In Progress"
          value={stats?.byStatus?.in_progress?.count || 0}
          icon={TrendingUp}
          color="blue"
          index={2}
        />
        <StatsCard
          title="Shipped This Month"
          value={stats?.byStatus?.shipped?.count || 0}
          icon={MessageSquare}
          color="green"
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
          className="bg-white border-2 border-ink"
        >
          <div className="px-6 py-4 border-b-2 border-ink flex items-center justify-between">
            <h2 className="font-oswald text-xl font-semibold uppercase">
              Top by Revenue at Risk
            </h2>
            <Link 
              href="/dashboard/roadmap?sort=total_arr"
              className="text-accent-600 hover:text-accent-700 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {topFeatures?.length > 0 ? (
              topFeatures.map((feature: any, index: number) => (
                <FeatureCardCompact key={feature.id} feature={feature} index={index} />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No features yet</p>
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
          className="bg-white border-2 border-ink"
        >
          <div className="px-6 py-4 border-b-2 border-ink flex items-center justify-between">
            <h2 className="font-oswald text-xl font-semibold uppercase">
              Recently Discovered
            </h2>
            <Link 
              href="/dashboard/roadmap?sort=created_at"
              className="text-accent-600 hover:text-accent-700 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentFeatures?.length > 0 ? (
              recentFeatures.map((feature: any, index: number) => (
                <FeatureCardCompact key={feature.id} feature={feature} index={index} />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No feedback yet</p>
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
          className="mt-8 bg-white border-2 border-ink p-6"
        >
          <h2 className="font-oswald text-xl font-semibold uppercase mb-6">
            Status Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['discovered', 'planned', 'in_progress', 'shipped', 'declined'].map((status) => {
              const data = stats.byStatus[status] || { count: 0, arr: 0 }
              return (
                <Link
                  key={status}
                  href={`/dashboard/roadmap?status=${status}`}
                  className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-center"
                >
                  <p className="text-3xl font-oswald font-bold">{data.count}</p>
                  <p className="text-sm text-gray-600 capitalize mt-1">
                    {status.replace('_', ' ')}
                  </p>
                  {data.arr > 0 && (
                    <p className="text-xs text-accent-600 mt-1 font-medium">
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

