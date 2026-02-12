'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Send, 
  Check, 
  X, 
  RefreshCw,
  Mail,
  MessageSquare,
  Edit2,
  Sparkles
} from 'lucide-react'
import { notifications } from '@/lib/api'
import { cn, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [editModal, setEditModal] = useState<{ open: boolean; notification: any }>({
    open: false,
    notification: null
  })
  const [editBody, setEditBody] = useState('')

  // Fetch pending notifications
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['notifications-pending'],
    queryFn: async () => {
      const res = await notifications.pending()
      return res.data.data
    },
    enabled: activeTab === 'pending'
  })

  // Fetch history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['notifications-history'],
    queryFn: async () => {
      const res = await notifications.history()
      return res.data.data
    },
    enabled: activeTab === 'history'
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => notifications.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-pending'] })
    }
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => notifications.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-pending'] })
    }
  })

  // Regenerate mutation
  const regenerateMutation = useMutation({
    mutationFn: (id: string) => notifications.regenerate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-pending'] })
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => 
      notifications.update(id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-pending'] })
      setEditModal({ open: false, notification: null })
    }
  })

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: (id: string) => notifications.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-pending'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-history'] })
    }
  })

  // Blast mutation
  const blastMutation = useMutation({
    mutationFn: () => notifications.blast(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-pending'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-history'] })
    }
  })

  const pendingNotifications = pendingData?.notifications || []
  const historyNotifications = historyData?.notifications || []

  const openEditModal = (notification: any) => {
    setEditBody(notification.body)
    setEditModal({ open: true, notification })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-oswald text-4xl font-bold uppercase tracking-wide">
            Notifications
          </h1>
          <p className="mt-2 text-gray-600">
            Review and send release notifications to customers
          </p>
        </div>

        {pendingNotifications.length > 0 && (
          <Button
            onClick={() => blastMutation.mutate()}
            isLoading={blastMutation.isPending}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send All Approved
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'px-6 py-3 font-oswald font-semibold uppercase text-sm border-b-2 -mb-0.5 transition-colors',
            activeTab === 'pending'
              ? 'border-wine-900 text-wine-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Pending Review
          {pendingNotifications.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-accent-600 text-white text-xs rounded-full">
              {pendingNotifications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-6 py-3 font-oswald font-semibold uppercase text-sm border-b-2 -mb-0.5 transition-colors',
            activeTab === 'history'
              ? 'border-wine-900 text-wine-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          History
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' ? (
        pendingLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-wine-900 border-t-transparent rounded-full" />
          </div>
        ) : pendingNotifications.length > 0 ? (
          <div className="space-y-4">
            {pendingNotifications.map((notification: any, index: number) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border-2 border-ink p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {notification.channel === 'email' ? (
                        <Mail className="w-5 h-5 text-gray-400" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-medium">{notification.recipient}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        {notification.customer_name || 'Unknown Customer'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Feature: <span className="font-medium">{notification.feature_title}</span>
                    </p>
                  </div>
                  
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium',
                    notification.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                    notification.status === 'approved' && 'bg-green-100 text-green-800'
                  )}>
                    {notification.status}
                  </span>
                </div>

                {/* Message Preview */}
                <div className="bg-gray-50 p-4 mb-4 border-l-4 border-wine-900">
                  {notification.subject && (
                    <p className="font-medium mb-2">Subject: {notification.subject}</p>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap">{notification.body}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(notification)}
                      leftIcon={<Edit2 className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateMutation.mutate(notification.id)}
                      isLoading={regenerateMutation.isPending}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Regenerate
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rejectMutation.mutate(notification.id)}
                      isLoading={rejectMutation.isPending}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      Reject
                    </Button>
                    {notification.status === 'pending' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => approveMutation.mutate(notification.id)}
                        isLoading={approveMutation.isPending}
                        leftIcon={<Check className="w-4 h-4" />}
                      >
                        Approve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => sendMutation.mutate(notification.id)}
                        isLoading={sendMutation.isPending}
                        leftIcon={<Send className="w-4 h-4" />}
                      >
                        Send Now
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-ink p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-oswald text-xl font-semibold uppercase mb-2">
              No Pending Notifications
            </h3>
            <p className="text-gray-600">
              Notifications will appear here when features are shipped
            </p>
          </div>
        )
      ) : (
        historyLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-wine-900 border-t-transparent rounded-full" />
          </div>
        ) : historyNotifications.length > 0 ? (
          <div className="space-y-2">
            {historyNotifications.map((notification: any) => (
              <div
                key={notification.id}
                className="bg-white border border-gray-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {notification.channel === 'email' ? (
                    <Mail className="w-5 h-5 text-gray-400" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">{notification.recipient}</p>
                    <p className="text-sm text-gray-500">{notification.feature_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium',
                    notification.status === 'sent' && 'bg-green-100 text-green-800',
                    notification.status === 'failed' && 'bg-red-100 text-red-800'
                  )}>
                    {notification.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {timeAgo(notification.sent_at || notification.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-ink p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-oswald text-xl font-semibold uppercase mb-2">
              No Notification History
            </h3>
            <p className="text-gray-600">
              Sent notifications will appear here
            </p>
          </div>
        )
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, notification: null })}
        title="Edit Notification"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="input min-h-[150px]"
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setEditModal({ open: false, notification: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate({
                id: editModal.notification?.id,
                body: editBody
              })}
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

