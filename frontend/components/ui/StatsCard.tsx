'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number
  format?: 'currency' | 'number' | 'percentage'
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'aqua' | 'emerald' | 'amber' | 'blue' | 'slate'
  index?: number
}

const colorClasses = {
  aqua: 'border-aqua-200 bg-aqua-50/50',
  emerald: 'border-emerald-200 bg-emerald-50/50',
  amber: 'border-amber-200 bg-amber-50/50',
  blue: 'border-blue-200 bg-blue-50/50',
  slate: 'border-slate-200 bg-slate-50/50',
}

const iconColorClasses = {
  aqua: 'bg-aqua-900 text-white',
  emerald: 'bg-emerald-600 text-white',
  amber: 'bg-amber-500 text-white',
  blue: 'bg-blue-600 text-white',
  slate: 'bg-slate-700 text-white',
}

const valueColorClasses = {
  aqua: 'text-aqua-900',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  blue: 'text-blue-700',
  slate: 'text-slate-900',
}

export function StatsCard({ 
  title, 
  value, 
  format = 'number', 
  icon: Icon,
  trend,
  color = 'aqua',
  index = 0
}: StatsCardProps) {
  const formattedValue = format === 'currency' 
    ? formatCurrency(value)
    : format === 'percentage'
    ? `${value}%`
    : formatNumber(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        'p-6 rounded-2xl border bg-white shadow-card hover:shadow-card-hover transition-shadow',
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>
          <p className={cn(
            'font-display text-3xl font-bold',
            valueColorClasses[color]
          )}>
            {formattedValue}
          </p>
          {trend && (
            <p className={cn(
              'text-sm font-medium flex items-center gap-1',
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          iconColorClasses[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  )
}
