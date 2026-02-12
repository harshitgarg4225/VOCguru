'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, DollarSign, ExternalLink, MoreHorizontal } from 'lucide-react'
import { cn, formatCurrency, getStatusColor, getStatusLabel, timeAgo } from '@/lib/utils'

interface Feature {
  id: string
  title: string
  problem_summary?: string
  status: string
  total_arr: number
  feedback_count: number
  tags?: string[]
  urgency_score?: number
  jira_issue_url?: string
  created_at: string
}

interface FeatureCardProps {
  feature: Feature
  index?: number
  onStatusChange?: (id: string, status: string) => void
}

export function FeatureCard({ feature, index = 0, onStatusChange }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="feature-card group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <Link 
            href={`/dashboard/features/${feature.id}`}
            className="block group-hover:text-accent-600 transition-colors"
          >
            <h3 className="font-oswald text-xl font-semibold uppercase tracking-wide text-ink truncate">
              {feature.title}
            </h3>
          </Link>

          {/* Problem Summary */}
          {feature.problem_summary && (
            <p className="mt-2 text-gray-600 text-sm line-clamp-2">
              {feature.problem_summary}
            </p>
          )}

          {/* Tags */}
          {feature.tags && feature.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {feature.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
              {feature.tags.length > 4 && (
                <span className="tag">+{feature.tags.length - 4}</span>
              )}
            </div>
          )}
        </div>

        {/* Revenue Badge */}
        {feature.total_arr > 0 && (
          <div className="revenue-badge flex-shrink-0">
            <DollarSign className="w-3 h-3 mr-1" />
            {formatCurrency(feature.total_arr)} ARR
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {/* Status */}
          <span className={getStatusColor(feature.status)}>
            {getStatusLabel(feature.status)}
          </span>

          {/* Feedback count */}
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {feature.feedback_count} feedback
          </span>

          {/* Time */}
          <span>{timeAgo(feature.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Jira link */}
          {feature.jira_issue_url && (
            <a
              href={feature.jira_issue_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-accent-600 transition-colors"
              title="View in Jira"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Actions menu */}
          <button className="p-1.5 text-gray-400 hover:text-ink transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Compact version for lists
export function FeatureCardCompact({ feature, index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="flex items-center gap-4 p-4 bg-white border-l-4 border-ink hover:border-accent-600 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <Link 
          href={`/dashboard/features/${feature.id}`}
          className="font-oswald font-medium uppercase tracking-wide text-ink hover:text-accent-600 transition-colors truncate block"
        >
          {feature.title}
        </Link>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span className={cn(getStatusColor(feature.status), 'text-xs')}>
            {getStatusLabel(feature.status)}
          </span>
          <span>{feature.feedback_count} feedback</span>
        </div>
      </div>

      {feature.total_arr > 0 && (
        <div className="revenue-badge text-xs">
          {formatCurrency(feature.total_arr)}
        </div>
      )}
    </motion.div>
  )
}

