'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User } from 'lucide-react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import { auth } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = isLogin
        ? await auth.login(formData.email, formData.password)
        : await auth.register(formData.email, formData.password, formData.name)

      if (response.data.success) {
        login(response.data.data.user, response.data.data.token)
        router.push('/dashboard')
      } else {
        setError(response.data.error || 'Authentication failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-950 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 -left-20 w-80 h-80 bg-aqua-900/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-0 w-96 h-96 bg-aqua-800/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="logo-mark-glow w-14 h-14">
              <span className="font-display font-bold text-white text-2xl">P</span>
            </div>
            <span className="font-display font-bold text-white text-3xl tracking-tight">
              PainSolver
            </span>
          </div>
          
          <h1 className="font-display text-5xl font-bold text-white leading-tight">
            Build what
            <br />
            <span className="text-gradient">customers need.</span>
          </h1>
          
          <p className="mt-6 text-xl text-slate-400 max-w-md leading-relaxed">
            Join product teams using PainSolver to prioritize based on customer value, not gut feeling.
          </p>

          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            {[
              'AI-powered feedback extraction',
              'Revenue-linked prioritization',
              'Automatic customer notifications'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="w-5 h-5 rounded-full bg-aqua-900 flex items-center justify-center">
                  <span className="text-aqua-400 text-xs">✓</span>
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-sm">
          © 2026 PainSolver. All rights reserved.
        </p>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="logo-mark">
              <span className="font-display font-bold text-white text-xl">P</span>
            </div>
            <span className="font-display font-semibold text-slate-900 text-2xl tracking-tight">
              PainSolver
            </span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-500 mb-8">
              {isLogin 
                ? 'Sign in to access your dashboard' 
                : 'Get started with PainSolver'}
            </p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <User className="w-5 h-5 text-slate-400" />
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
              )}

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                inputProps={{ minLength: 6 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </IconButton>
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

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="text-slate-600 hover:text-aqua-900 font-medium transition-colors"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>

          <Link 
            href="/"
            className="lg:hidden flex items-center justify-center gap-2 mt-8 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
