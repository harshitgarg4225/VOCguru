'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft, 
  MessageSquare, 
  DollarSign, 
  ExternalLink,
  Edit2,
  Merge,
  Send,
  Clock,
  User,
  Tag
} from 'lucide-react'
import { features, roadmap } from '@/lib/api'
import { cn, formatCurrency, getStatusColor, getStatusLabel, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const statusOptions = [
  { value: 'discovered', label: 'Discovered' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'declined', label: 'Declined' },
]

export default function FeatureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const featureId = params.id as string

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [jiraModalOpen, setJiraModalOpen] = useState(false)

  // Fetch feature
  const { data: feature, isLoading } = useQuery({
    queryKey: ['feature', featureId],
    queryFn: async () => {
      const res = await features.get(featureId)
      return res.data.data
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => features.update(featureId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature', featureId] })
      setIsEditing(false)
    }
  })

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: (status: string) => roadmap.updateStatus(featureId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature', featureId] })
    }
  })

  // Push to Jira mutation
  const jiraMutation = useMutation({
    mutationFn: () => roadmap.pushToJira(featureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature', featureId] })
      setJiraModalOpen(false)
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-wine-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!feature) {
    return (
      <div className="p-8 text-center">
        <h2 className="font-oswald text-2xl font-bold uppercase">Feature Not Found</h2>
        <Link href="/dashboard/roadmap" className="text-accent-600 hover:underline mt-4 inline-block">
          Back to Roadmap
        </Link>
      </div>
    )
  }

  const linkedFeedback = feature.linked_feedback || []

  return (
    <div className="p-8 max-w-5xl">
      {/* Back Link */}
      <Link
        href="/dashboard/roadmap"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-wine-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Roadmap
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-ink p-8 mb-8"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editData.title || feature.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="input font-oswald text-3xl font-bold uppercase"
              />
            ) : (
              <h1 className="font-oswald text-3xl font-bold uppercase tracking-wide">
                {feature.title}
              </h1>
            )}
          </div>

          {feature.total_arr > 0 && (
            <div className="revenue-badge text-lg">
              <DollarSign className="w-4 h-4 mr-1" />
              {formatCurrency(feature.total_arr)} ARR
            </div>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className={cn(getStatusColor(feature.status), 'text-sm')}>
            {getStatusLabel(feature.status)}
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <MessageSquare className="w-4 h-4" />
            {feature.feedback_count} feedback
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            {timeAgo(feature.created_at)}
          </span>
          {feature.jira_issue_url && (
            <a
              href={feature.jira_issue_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-accent-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              {feature.jira_issue_key}
            </a>
          )}
        </div>

        {/* Problem Summary */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-500 uppercase mb-2">
            Problem Summary
          </label>
          {isEditing ? (
            <textarea
              value={editData.description || feature.problem_summary || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="input min-h-[100px]"
              rows={4}
            />
          ) : (
            <p className="text-gray-700">
              {feature.problem_summary || 'No summary available'}
            </p>
          )}
        </div>

        {/* Tags */}
        {feature.tags && feature.tags.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 uppercase mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {feature.tags.map((tag: string) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateMutation.mutate(editData)}
                isLoading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditData({
                    title: feature.title,
                    description: feature.problem_summary
                  })
                  setIsEditing(true)
                }}
                leftIcon={<Edit2 className="w-4 h-4" />}
              >
                Edit
              </Button>

              {!feature.jira_issue_key && (
                <Button
                  variant="secondary"
                  onClick={() => setJiraModalOpen(true)}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Push to Jira
                </Button>
              )}

              <select
                value={feature.status}
                onChange={(e) => statusMutation.mutate(e.target.value)}
                className="input w-auto"
                disabled={statusMutation.isPending}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </motion.div>

      {/* Linked Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-2 border-ink"
      >
        <div className="px-6 py-4 border-b-2 border-ink">
          <h2 className="font-oswald text-xl font-semibold uppercase">
            Customer Feedback ({linkedFeedback.length})
          </h2>
        </div>

        {linkedFeedback.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {linkedFeedback.map((feedback: any, index: number) => (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-wine-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-wine-900" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {feedback.customer_name || feedback.author_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {feedback.author_email || 'No email'}
                        {feedback.customer_arr > 0 && (
                          <span className="ml-2 text-accent-600">
                            • {formatCurrency(feedback.customer_arr)} ARR
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p className="capitalize">{feedback.source}</p>
                    <p>{timeAgo(feedback.created_at)}</p>
                  </div>
                </div>

                <blockquote className="pl-4 border-l-4 border-wine-200 text-gray-700 italic">
                  "{feedback.content}"
                </blockquote>

                {feedback.metadata?.permalink && (
                  <a
                    href={feedback.metadata.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-accent-600 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View original
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No feedback linked to this feature yet</p>
          </div>
        )}
      </motion.div>

      {/* Jira Modal */}
      <Modal
        isOpen={jiraModalOpen}
        onClose={() => !jiraMutation.isPending && setJiraModalOpen(false)}
        title="Push to Jira"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          This will create a new Jira issue with the feature details and customer quotes.
        </p>

        {jiraMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
            Failed to create Jira issue. Please check your integration settings.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setJiraModalOpen(false)}
            disabled={jiraMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => jiraMutation.mutate()}
            isLoading={jiraMutation.isPending}
          >
            Create Issue
          </Button>
        </div>
      </Modal>
    </div>
  )
}

