'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, DollarSign, ExternalLink, MoreHorizontal, TrendingUp } from 'lucide-react'
import { cn, formatCurrency, getStatusColor, getStatusLabel, timeAgo } from '@/lib/utils'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

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
            className="block group-hover:text-aqua-700 transition-colors"
          >
            <h3 className="font-display text-lg font-semibold text-slate-900 line-clamp-1">
              {feature.title}
            </h3>
          </Link>

          {/* Problem Summary */}
          {feature.problem_summary && (
            <p className="mt-2 text-slate-600 text-sm line-clamp-2">
              {feature.problem_summary}
            </p>
          )}

          {/* Tags */}
          {feature.tags && feature.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {feature.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    height: '24px',
                    fontSize: '0.75rem',
                    backgroundColor: '#f4f4f5',
                    color: '#3f3f46',
                    '&:hover': {
                      backgroundColor: '#e4e4e7',
                    },
                  }}
                />
              ))}
              {feature.tags.length > 3 && (
                <Chip
                  label={`+${feature.tags.length - 3}`}
                  size="small"
                  sx={{
                    height: '24px',
                    fontSize: '0.75rem',
                    backgroundColor: '#f4f4f5',
                    color: '#71717a',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Revenue Badge */}
        {feature.total_arr > 0 && (
          <div className="revenue-badge flex-shrink-0">
            <DollarSign className="w-3 h-3 mr-1" />
            {formatCurrency(feature.total_arr)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          {/* Status */}
          <span className={getStatusColor(feature.status)}>
            {getStatusLabel(feature.status)}
          </span>

          {/* Feedback count */}
          <span className="flex items-center gap-1 text-slate-500">
            <MessageSquare className="w-4 h-4" />
            {feature.feedback_count}
          </span>

          {/* Time */}
          <span className="text-slate-400">{timeAgo(feature.created_at)}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Urgency indicator */}
          {feature.urgency_score && feature.urgency_score > 7 && (
            <Tooltip title="High urgency" arrow>
              <div className="p-1.5 text-amber-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </Tooltip>
          )}

          {/* Jira link */}
          {feature.jira_issue_url && (
            <Tooltip title="View in Jira" arrow>
              <IconButton
                component="a"
                href={feature.jira_issue_url}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: '#a1a1aa', '&:hover': { color: '#004549' } }}
              >
                <ExternalLink className="w-4 h-4" />
              </IconButton>
            </Tooltip>
          )}

          {/* Actions menu */}
          <IconButton
            size="small"
            sx={{ color: '#a1a1aa', '&:hover': { color: '#09090b' } }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </IconButton>
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
      className="flex items-center gap-4 p-4 bg-white border-l-4 border-aqua-900 hover:border-aqua-600 hover:bg-slate-50 transition-all"
    >
      <div className="flex-1 min-w-0">
        <Link 
          href={`/dashboard/features/${feature.id}`}
          className="font-medium text-slate-900 hover:text-aqua-700 transition-colors truncate block"
        >
          {feature.title}
        </Link>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span className={cn(getStatusColor(feature.status), 'text-xs')}>
            {getStatusLabel(feature.status)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {feature.feedback_count}
          </span>
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
