'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Zap, Users, BarChart3, Bell, MessageCircle, Target, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient Orbs Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-aqua-900/30 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-80 h-80 bg-aqua-700/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-aqua-800/20 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 30h60M30 0v60' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-20 py-4">
            <div className="flex items-center gap-3">
              <div className="logo-mark-glow">
                <span className="font-display font-bold text-white text-xl">P</span>
              </div>
              <span className="font-display font-semibold text-white text-2xl tracking-tight">
                PainSolver
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/portal" className="text-slate-400 hover:text-white transition-colors font-medium">
                Roadmap
              </Link>
              <Link href="/docs" className="text-slate-400 hover:text-white transition-colors font-medium">
                Docs
              </Link>
              <Link href="/login" className="btn-accent">
                Get Started
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-4xl pt-12 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-aqua-900/30 border border-aqua-800/50 rounded-full text-aqua-400 text-sm font-medium mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aqua-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-aqua-500"></span>
              </span>
              Replacing Canny? You're in the right place.
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight"
            >
              Stop guessing.
              <br />
              <span className="text-gradient">Build what sells.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 text-xl text-slate-400 leading-relaxed max-w-2xl"
            >
              PainSolver collects customer feedback from Slack, Zoom, and support tickets. 
              AI extracts features, ties them to revenue, and shows you exactly what to build next.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 flex flex-wrap gap-4"
            >
              <Link href="/login" className="btn-accent text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/portal" className="btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10 text-lg px-8 py-4">
                View Live Demo
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 flex items-center gap-8"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-sm font-medium text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-slate-400 text-sm">
                <span className="text-white font-semibold">500+</span> product teams use PainSolver
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-aqua-50 text-aqua-900 rounded-full text-sm font-medium mb-6"
            >
              <Target className="w-4 h-4" />
              How it works
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl md:text-5xl font-bold text-slate-900 tracking-tight"
            >
              From chaos to clarity
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto"
            >
              Stop drowning in feedback. Let AI surface what matters most.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: MessageCircle,
                title: 'Auto-Collect',
                description: 'Connect Slack, Zoom, and support tools. Feedback flows in automatically.',
                color: 'aqua'
              },
              {
                icon: Users,
                title: 'Link to Revenue',
                description: 'Sync with Stripe. See exactly how much ARR is tied to each request.',
                color: 'emerald'
              },
              {
                icon: Zap,
                title: 'AI Synthesis',
                description: 'Groq-powered extraction deduplicates and categorizes requests automatically.',
                color: 'amber'
              },
              {
                icon: Bell,
                title: 'Close the Loop',
                description: 'Auto-notify customers when features ship. Build loyalty at scale.',
                color: 'blue'
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl mb-6 ${
                  feature.color === 'aqua' ? 'bg-aqua-100 text-aqua-900' :
                  feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  feature.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-slate-900 py-24 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { value: '10x', label: 'Faster feedback processing' },
              { value: '73%', label: 'Better feature prioritization' },
              { value: '2.5x', label: 'Increase in customer retention' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="font-display text-5xl font-bold text-gradient mb-3">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-slate-950 py-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aqua-900/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            Ready to solve the pain?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-slate-400"
          >
            Start collecting feedback in minutes. No credit card required.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex justify-center gap-4"
          >
            <Link href="/login" className="btn-accent text-lg px-8 py-4">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="logo-mark">
                <span className="font-display font-bold text-white text-lg">P</span>
              </div>
              <span className="font-display font-semibold text-white text-xl tracking-tight">
                PainSolver
              </span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/docs" className="text-slate-400 hover:text-white transition-colors text-sm">
                Documentation
              </Link>
              <Link href="/portal" className="text-slate-400 hover:text-white transition-colors text-sm">
                Roadmap
              </Link>
              <Link href="https://github.com/harshitgarg4225/painsolver" className="text-slate-400 hover:text-white transition-colors text-sm">
                GitHub
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © 2026 PainSolver. Built for product teams who listen.
          </div>
        </div>
      </footer>
    </div>
  )
}
