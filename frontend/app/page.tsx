'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Zap, Users, BarChart3, Bell } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-wine-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-600 flex items-center justify-center">
                <span className="font-oswald font-bold text-white text-xl">P</span>
              </div>
              <span className="font-oswald font-semibold text-white text-2xl uppercase tracking-wide">
                Propel
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/portal" className="text-wine-200 hover:text-white transition-colors font-medium">
                Public Roadmap
              </Link>
              <Link href="/login" className="btn-primary">
                Login
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-oswald text-5xl md:text-7xl font-bold text-white uppercase leading-tight"
            >
              Turn Customer Feedback Into
              <span className="text-accent-600"> Revenue</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-xl text-wine-200 leading-relaxed"
            >
              Propel automatically collects feedback from Slack, Zoom, and support tickets. 
              AI extracts features, deduplicates requests, and calculates revenue impact so you 
              build what matters most.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link href="/login" className="btn-primary text-lg">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/portal" className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-wine-900">
                View Demo Roadmap
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-canvas py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-oswald text-4xl font-bold text-ink uppercase">
              Everything You Need
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              From collection to closure, all in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: 'Auto-Collect',
                description: 'Slack reactions, Zoom transcripts, and tickets flow in automatically.'
              },
              {
                icon: Users,
                title: 'Know Your Customers',
                description: 'Automatically link feedback to Stripe ARR. See revenue at risk.'
              },
              {
                icon: BarChart3,
                title: 'AI Synthesis',
                description: 'Groq-powered extraction and deduplication. No manual tagging.'
              },
              {
                icon: Bell,
                title: 'Close the Loop',
                description: 'Auto-notify customers when their feature ships. Build loyalty.'
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="feature-card text-center"
              >
                <div className="inline-flex p-4 bg-wine-900 text-white rounded-lg mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-oswald text-xl font-semibold uppercase mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-ink py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white uppercase">
            Ready to Propel Your Product?
          </h2>
          <p className="mt-6 text-xl text-gray-400">
            Start collecting feedback in minutes. No credit card required.
          </p>
          <div className="mt-10">
            <Link href="/login" className="btn-primary text-lg">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-wine-900 py-12 border-t border-wine-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent-600 flex items-center justify-center">
                <span className="font-oswald font-bold text-white text-lg">P</span>
              </div>
              <span className="font-oswald font-semibold text-white text-xl uppercase tracking-wide">
                Propel
              </span>
            </div>
            <p className="text-wine-300 text-sm">
              © 2024 Propel. Built with 💜
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

