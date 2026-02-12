'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ThumbsUp, 
  AlertCircle, 
  ChevronRight,
  Check,
  X,
  Mail
} from 'lucide-react'
import { portal } from '@/lib/api'
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export default function PublicPortalPage() {
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [voteModalOpen, setVoteModalOpen] = useState(false)
  const [voteData, setVoteData] = useState({
    email: '',
    is_critical: false,
    wants_updates: true,
  })
  const [voteSuccess, setVoteSuccess] = useState(false)

  // Fetch public roadmap
  const { data, isLoading } = useQuery({
    queryKey: ['public-roadmap'],
    queryFn: async () => {
      const res = await portal.roadmap({ status: 'planned,in_progress,shipped' })
      return res.data.data
    }
  })

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ featureId, data }: { featureId: string; data: typeof voteData }) => {
      return portal.vote(featureId, data)
    },
    onSuccess: () => {
      setVoteSuccess(true)
      setTimeout(() => {
        setVoteModalOpen(false)
        setVoteSuccess(false)
        setVoteData({ email: '', is_critical: false, wants_updates: true })
      }, 2000)
    }
  })

  const handleVote = (feature: any) => {
    setSelectedFeature(feature)
    setVoteModalOpen(true)
  }

  const submitVote = () => {
    if (selectedFeature && voteData.email) {
      voteMutation.mutate({
        featureId: selectedFeature.id,
        data: voteData
      })
    }
  }

  const features = data?.features || []
  const plannedFeatures = features.filter((f: any) => f.status === 'planned')
  const inProgressFeatures = features.filter((f: any) => f.status === 'in_progress')
  const shippedFeatures = features.filter((f: any) => f.status === 'shipped')

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-white border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-wine-900 flex items-center justify-center">
                <span className="font-oswald font-bold text-white text-xl">P</span>
              </div>
              <div>
                <span className="font-oswald font-semibold text-ink text-xl uppercase tracking-wide">
                  Propel
                </span>
                <span className="text-gray-400 ml-2">Roadmap</span>
              </div>
            </div>
            <Link href="/login" className="btn-ghost">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-wine-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-oswald text-4xl md:text-5xl font-bold text-white uppercase">
            Product Roadmap
          </h1>
          <p className="mt-4 text-xl text-wine-200">
            See what we're building and vote for features you need most
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-wine-900 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* In Progress */}
            {inProgressFeatures.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                  <h2 className="font-oswald text-2xl font-bold uppercase">
                    In Progress
                  </h2>
                  <span className="text-gray-400">({inProgressFeatures.length})</span>
                </div>
                <div className="space-y-4">
                  {inProgressFeatures.map((feature: any, index: number) => (
                    <PortalFeatureCard
                      key={feature.id}
                      feature={feature}
                      index={index}
                      onVote={() => handleVote(feature)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Planned */}
            {plannedFeatures.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <h2 className="font-oswald text-2xl font-bold uppercase">
                    Planned
                  </h2>
                  <span className="text-gray-400">({plannedFeatures.length})</span>
                </div>
                <div className="space-y-4">
                  {plannedFeatures.map((feature: any, index: number) => (
                    <PortalFeatureCard
                      key={feature.id}
                      feature={feature}
                      index={index}
                      onVote={() => handleVote(feature)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Shipped */}
            {shippedFeatures.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <h2 className="font-oswald text-2xl font-bold uppercase">
                    Recently Shipped
                  </h2>
                  <span className="text-gray-400">({shippedFeatures.length})</span>
                </div>
                <div className="space-y-4">
                  {shippedFeatures.slice(0, 5).map((feature: any, index: number) => (
                    <PortalFeatureCard
                      key={feature.id}
                      feature={feature}
                      index={index}
                      isShipped
                    />
                  ))}
                </div>
              </section>
            )}

            {features.length === 0 && (
              <div className="bg-white border-2 border-ink p-12 text-center">
                <h3 className="font-oswald text-xl font-semibold uppercase mb-2">
                  Roadmap Coming Soon
                </h3>
                <p className="text-gray-600">
                  We're working on exciting new features. Check back soon!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vote Modal */}
      <Modal
        isOpen={voteModalOpen}
        onClose={() => !voteMutation.isPending && setVoteModalOpen(false)}
        title={voteSuccess ? '' : 'I Need This'}
        size="sm"
      >
        <AnimatePresence mode="wait">
          {voteSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-oswald text-2xl font-semibold uppercase mb-2">
                Thanks!
              </h3>
              <p className="text-gray-600">
                We'll notify you when this ships.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {selectedFeature && (
                <div className="mb-6 p-4 bg-gray-50 border-l-4 border-wine-900">
                  <h4 className="font-oswald font-semibold uppercase">
                    {selectedFeature.title}
                  </h4>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email for Updates
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={voteData.email}
                      onChange={(e) => setVoteData({ ...voteData, email: e.target.value })}
                      className="input pl-10"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={voteData.is_critical}
                    onChange={(e) => setVoteData({ ...voteData, is_critical: e.target.checked })}
                    className="w-5 h-5 text-accent-600"
                  />
                  <div>
                    <span className="font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-accent-600" />
                      This is critical for me
                    </span>
                    <span className="text-sm text-gray-600">
                      Helps us prioritize urgent requests
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={voteData.wants_updates}
                    onChange={(e) => setVoteData({ ...voteData, wants_updates: e.target.checked })}
                    className="w-5 h-5 text-wine-900"
                  />
                  <span className="text-sm text-gray-600">
                    Email me when this ships
                  </span>
                </label>
              </div>

              {voteMutation.isError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
                  {(voteMutation.error as any)?.response?.data?.error || 'Something went wrong'}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setVoteModalOpen(false)}
                  disabled={voteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={submitVote}
                  isLoading={voteMutation.isPending}
                  disabled={!voteData.email}
                >
                  Submit Vote
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-ink py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600 text-sm">
          Powered by <span className="font-oswald font-semibold">Propel</span>
        </div>
      </footer>
    </div>
  )
}

// Portal Feature Card Component
function PortalFeatureCard({ 
  feature, 
  index, 
  onVote,
  isShipped = false 
}: { 
  feature: any
  index: number
  onVote?: () => void
  isShipped?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white border-2 border-ink p-6 hover:shadow-card transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-oswald text-xl font-semibold uppercase tracking-wide">
            {feature.title}
          </h3>
          {feature.problem_summary && (
            <p className="mt-2 text-gray-600">
              {feature.problem_summary}
            </p>
          )}
          {feature.tags && feature.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {feature.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isShipped && onVote ? (
          <button
            onClick={onVote}
            className="flex flex-col items-center gap-1 p-4 border-2 border-gray-200 hover:border-accent-600 hover:bg-red-50 transition-colors group"
          >
            <ThumbsUp className="w-6 h-6 text-gray-400 group-hover:text-accent-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-accent-600">
              {feature.vote_count || feature.public_votes || 0}
            </span>
          </button>
        ) : isShipped ? (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="font-medium">Shipped</span>
          </div>
        ) : null}
      </div>

      {feature.critical_count > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-accent-600">
          <AlertCircle className="w-4 h-4" />
          {feature.critical_count} people marked this as critical
        </div>
      )}
    </motion.div>
  )
}

