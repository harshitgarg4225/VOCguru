'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ThumbsUp, 
  AlertCircle, 
  Check,
  Mail,
  Search,
  Filter
} from 'lucide-react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import { portal } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export default function PublicPortalPage() {
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [voteModalOpen, setVoteModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
  
  // Filter features by search
  const filteredFeatures = features.filter((f: any) => 
    !searchQuery || 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.problem_summary?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const plannedFeatures = filteredFeatures.filter((f: any) => f.status === 'planned')
  const inProgressFeatures = filteredFeatures.filter((f: any) => f.status === 'in_progress')
  const shippedFeatures = filteredFeatures.filter((f: any) => f.status === 'shipped')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="logo-mark">
                <span className="font-display font-bold text-white text-lg">P</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-slate-900 text-xl tracking-tight">
                  PainSolver
                </span>
                <Chip 
                  label="Roadmap" 
                  size="small"
                  sx={{ 
                    backgroundColor: '#e6feff',
                    color: '#004549',
                    fontWeight: 500,
                  }}
                />
              </div>
            </Link>
            <Link href="/login" className="btn-ghost text-sm">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-slate-900 py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-aqua-900/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">
            Product Roadmap
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            See what we're building, vote for features you need, and get notified when they ship.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-card p-4">
          <TextField
            fullWidth
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                backgroundColor: '#fafafa',
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: '#e4e4e7',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#004549',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-aqua-900 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* In Progress */}
            {inProgressFeatures.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                  <h2 className="font-display text-xl font-semibold text-slate-900">
                    In Progress
                  </h2>
                  <span className="text-slate-400">({inProgressFeatures.length})</span>
                </div>
                <div className="grid gap-4">
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
                  <h2 className="font-display text-xl font-semibold text-slate-900">
                    Planned
                  </h2>
                  <span className="text-slate-400">({plannedFeatures.length})</span>
                </div>
                <div className="grid gap-4">
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
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <h2 className="font-display text-xl font-semibold text-slate-900">
                    Recently Shipped
                  </h2>
                  <span className="text-slate-400">({shippedFeatures.length})</span>
                </div>
                <div className="grid gap-4">
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

            {filteredFeatures.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                {searchQuery ? (
                  <>
                    <Filter className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="font-display text-xl font-semibold text-slate-900 mb-2">
                      No Results
                    </h3>
                    <p className="text-slate-600">
                      No features match "{searchQuery}"
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-6"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-xl font-semibold text-slate-900 mb-2">
                      Roadmap Coming Soon
                    </h3>
                    <p className="text-slate-600">
                      We're working on exciting new features. Check back soon!
                    </p>
                  </>
                )}
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
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-slate-900 mb-2">
                Thanks!
              </h3>
              <p className="text-slate-600">
                We'll notify you when this ships.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {selectedFeature && (
                <div className="mb-6 p-4 bg-slate-50 border-l-4 border-aqua-900 rounded-r-xl">
                  <h4 className="font-semibold text-slate-900">
                    {selectedFeature.title}
                  </h4>
                </div>
              )}

              <div className="space-y-4">
                <TextField
                  fullWidth
                  label="Email for Updates"
                  type="email"
                  value={voteData.email}
                  onChange={(e) => setVoteData({ ...voteData, email: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail className="w-5 h-5 text-slate-400" />
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
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#004549',
                    },
                  }}
                />

                <div 
                  onClick={() => setVoteData({ ...voteData, is_critical: !voteData.is_critical })}
                  className={cn(
                    'p-4 rounded-xl border-2 cursor-pointer transition-all',
                    voteData.is_critical 
                      ? 'bg-amber-50 border-amber-300' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={voteData.is_critical}
                      sx={{
                        padding: 0,
                        color: '#d4d4d8',
                        '&.Mui-checked': {
                          color: '#f59e0b',
                        },
                      }}
                    />
                    <div>
                      <span className="font-medium flex items-center gap-2 text-slate-900">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        This is critical for me
                      </span>
                      <span className="text-sm text-slate-600">
                        Helps us prioritize urgent requests
                      </span>
                    </div>
                  </div>
                </div>

                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={voteData.wants_updates}
                      onChange={(e) => setVoteData({ ...voteData, wants_updates: e.target.checked })}
                      sx={{
                        color: '#d4d4d8',
                        '&.Mui-checked': {
                          color: '#004549',
                        },
                      }}
                    />
                  }
                  label={<span className="text-sm text-slate-600">Email me when this ships</span>}
                />
              </div>

              {voteMutation.isError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
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
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Powered by{' '}
            <Link href="/" className="font-semibold text-aqua-900 hover:text-aqua-700">
              PainSolver
            </Link>
          </p>
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
      className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-card-hover hover:border-slate-300 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-slate-900">
            {feature.title}
          </h3>
          {feature.problem_summary && (
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              {feature.problem_summary}
            </p>
          )}
          {feature.tags && feature.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {feature.tags.slice(0, 3).map((tag: string) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    height: '24px',
                    fontSize: '0.75rem',
                    backgroundColor: '#f4f4f5',
                    color: '#3f3f46',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {!isShipped && onVote ? (
          <button
            onClick={onVote}
            className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-slate-200 hover:border-aqua-500 hover:bg-aqua-50 transition-all group"
          >
            <ThumbsUp className="w-5 h-5 text-slate-400 group-hover:text-aqua-700" />
            <span className="text-sm font-semibold text-slate-600 group-hover:text-aqua-700">
              {feature.vote_count || feature.public_votes || 0}
            </span>
          </button>
        ) : isShipped ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-full">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Shipped</span>
          </div>
        ) : null}
      </div>

      {feature.critical_count > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="w-4 h-4" />
          {feature.critical_count} people marked this as critical
        </div>
      )}
    </motion.div>
  )
}
