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
  color?: 'wine' | 'accent' | 'green' | 'blue'
  index?: number
}

const colorClasses = {
  wine: 'bg-wine-50 text-wine-900 border-wine-200',
  accent: 'bg-red-50 text-accent-600 border-red-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
}

const iconColorClasses = {
  wine: 'bg-wine-900 text-white',
  accent: 'bg-accent-600 text-white',
  green: 'bg-green-600 text-white',
  blue: 'bg-blue-600 text-white',
}

export function StatsCard({ 
  title, 
  value, 
  format = 'number', 
  icon: Icon,
  trend,
  color = 'wine',
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
        'p-6 border-2 bg-white',
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 font-oswald text-3xl font-bold">
            {formattedValue}
          </p>
          {trend && (
            <p className={cn(
              'mt-2 text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-gray-500 font-normal"> vs last month</span>
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-lg',
          iconColorClasses[color]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}

