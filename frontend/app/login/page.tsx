'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
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
    <div className="min-h-screen bg-wine-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </Link>

        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-accent-600 flex items-center justify-center">
              <span className="font-oswald font-bold text-white text-3xl">P</span>
            </div>
            <span className="font-oswald font-bold text-white text-4xl uppercase tracking-wide">
              Propel
            </span>
          </div>
          
          <h1 className="font-oswald text-5xl font-bold text-white uppercase leading-tight">
            Build What
            <br />
            <span className="text-accent-600">Matters Most</span>
          </h1>
          
          <p className="mt-6 text-xl text-wine-200 max-w-md">
            Join product teams using Propel to prioritize based on customer value, not gut feeling.
          </p>
        </div>

        <p className="text-wine-400 text-sm">
          © 2024 Propel. All rights reserved.
        </p>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-canvas">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-wine-900 flex items-center justify-center">
              <span className="font-oswald font-bold text-white text-xl">P</span>
            </div>
            <span className="font-oswald font-semibold text-wine-900 text-2xl uppercase tracking-wide">
              Propel
            </span>
          </div>

          <div className="bg-white border-2 border-ink p-8">
            <h2 className="font-oswald text-3xl font-bold uppercase text-center mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 text-center mb-8">
              {isLogin 
                ? 'Sign in to access your dashboard' 
                : 'Get started with Propel'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input pr-12"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="text-wine-900 hover:text-accent-600 font-medium transition-colors"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>

          <Link 
            href="/"
            className="lg:hidden flex items-center justify-center gap-2 mt-6 text-gray-600 hover:text-wine-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

