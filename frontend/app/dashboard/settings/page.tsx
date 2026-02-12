'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Key, 
  Link2, 
  Bell,
  Check,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const integrations = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Capture feedback from channels and reactions',
    icon: '💬',
    connected: false,
    config: ['Bot Token', 'Signing Secret', 'Monitored Channels']
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Parse meeting transcripts automatically',
    icon: '📹',
    connected: false,
    config: ['Account ID', 'Client ID', 'Client Secret']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Fetch customer ARR and plan data',
    icon: '💳',
    connected: false,
    config: ['Secret Key']
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Push features and sync status',
    icon: '📋',
    connected: false,
    config: ['Base URL', 'Email', 'API Token', 'Project Key']
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Send email notifications to customers',
    icon: '📧',
    connected: false,
    config: ['API Key', 'From Email']
  }
]

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('integrations')
  const [copied, setCopied] = useState(false)

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/ingest`
    : '/api/webhooks/ingest'

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-oswald text-4xl font-bold uppercase tracking-wide">
          Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Configure integrations and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-gray-200 mb-8">
        {[
          { id: 'integrations', label: 'Integrations', icon: Link2 },
          { id: 'api', label: 'API & Webhooks', icon: Key },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-6 py-3 font-oswald font-semibold uppercase text-sm border-b-2 -mb-0.5 transition-colors flex items-center gap-2',
              activeTab === tab.id
                ? 'border-wine-900 text-wine-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-ink p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <h3 className="font-oswald text-lg font-semibold uppercase">
                      {integration.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {integration.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {integration.config.map((item) => (
                        <span key={item} className="text-xs bg-gray-100 px-2 py-1 text-gray-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {integration.connected ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Connected
                    </span>
                  ) : (
                    <Button variant="secondary" size="sm">
                      Configure
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          <p className="text-sm text-gray-500 mt-6">
            Integration configuration is managed via environment variables. 
            See the README for setup instructions.
          </p>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="space-y-8">
          {/* Webhook URL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-ink p-6"
          >
            <h3 className="font-oswald text-lg font-semibold uppercase mb-4">
              Webhook URL
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Send feedback from any source to this endpoint with an X-Source header.
            </p>
            
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 px-4 py-3 text-sm font-mono overflow-x-auto">
                {webhookUrl}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={copyWebhookUrl}
                leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </motion.div>

          {/* Example Request */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-ink p-6"
          >
            <h3 className="font-oswald text-lg font-semibold uppercase mb-4">
              Example Request
            </h3>
            <pre className="bg-ink text-white p-4 overflow-x-auto text-sm font-mono rounded">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Source: manual" \\
  -d '{
    "content": "User feedback text here",
    "author_email": "user@example.com",
    "author_name": "John Doe"
  }'`}
            </pre>
          </motion.div>

          {/* API Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-ink p-6"
          >
            <h3 className="font-oswald text-lg font-semibold uppercase mb-4">
              API Documentation
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Full API documentation is available in the project README.
            </p>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ExternalLink className="w-4 h-4" />}
              onClick={() => window.open('https://github.com/yourcompany/propel', '_blank')}
            >
              View Documentation
            </Button>
          </motion.div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-ink p-6"
        >
          <h3 className="font-oswald text-lg font-semibold uppercase mb-4">
            Notification Preferences
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium">Auto-generate notifications</p>
                <p className="text-sm text-gray-600">
                  Automatically create notification drafts when features ship
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-wine-900" />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-gray-600">
                  Send notifications via email (requires Resend)
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-wine-900" />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium">Slack notifications</p>
                <p className="text-sm text-gray-600">
                  Send notifications via Slack DM (requires Slack bot)
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-wine-900" />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium">Require approval</p>
                <p className="text-sm text-gray-600">
                  Notifications must be approved before sending
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-wine-900" />
            </label>
          </div>

          <div className="mt-6">
            <Button>Save Preferences</Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

