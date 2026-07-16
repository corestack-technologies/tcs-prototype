import { useState } from 'react'
import { Logo, Button, Field, Input, Alert } from './ui'
import type { View, NavMeta } from '../App'

interface LoginProps { navigate: (v: View, meta?: NavMeta) => void }

export function Login({ navigate }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (email === 'reviewer@tcs.ng') navigate('reviewer-queue')
      else if (email === 'org-reviewer@tcs.ng') navigate('org-review-queue')
      else if (email === 'owner@tcs.ng') navigate('owner-dashboard')
      else if (email === 'eligible@tcs.ng') navigate('org-opportunity')
      else if (email.includes('new')) navigate('dashboard-new')
      else navigate('dashboard')
    }, 1400)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#1746A2] px-12 py-10">
        <Logo size="md" />
        <div>
          <div className="w-14 h-1 bg-[#7DD3FC] rounded-full mb-6" />
          <h2 className="display-font text-4xl font-800 text-white leading-tight mb-4">
            Build trusted thrift organizations, <span className="text-[#7DD3FC]">together.</span>
          </h2>
          <p className="text-[#BFDBFE] text-base leading-relaxed">
            TCS gives thrift and Ajo communities the infrastructure to operate with transparency, accountability, and trust — from contributions to payouts.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Active organizations', value: '1,240+' },
              { label: 'Members served', value: '28,000+' },
              { label: 'Contributions tracked', value: '₦480M+' },
              { label: 'Uptime', value: '99.9%' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3">
                <div className="display-font text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-[#BFDBFE] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[#BFDBFE] text-xs">© 2025 Thrift Core System. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <div className="mb-8">
            <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-1">Welcome back</h1>
            <p className="text-[#6B7280] text-sm">Sign in to your TCS account to continue.</p>
          </div>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <Field label="Email address" required>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" required>
              <Input
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                suffix={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs font-medium text-[#1746A2] hover:underline">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                }
              />
            </Field>

            <div className="flex justify-end">
              <button type="button" className="text-xs text-[#1746A2] hover:underline font-medium">Forgot password?</button>
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Don't have an account?{' '}
            <button onClick={() => navigate('signup')} className="text-[#1746A2] font-semibold hover:underline">
              Create one
            </button>
          </p>

          <div className="mt-8 p-4 rounded-xl bg-[#F1F3F8] border border-[#E2E6F0]">
            <p className="text-xs text-[#6B7280] font-semibold mb-2 uppercase tracking-wide">Demo credentials</p>
            <p className="text-xs text-[#0D1117]"><span className="font-medium">Active member:</span> any email + any password</p>
            <p className="text-xs text-[#0D1117]"><span className="font-medium">New user:</span> new@tcs.ng + any password</p>
            <p className="text-xs text-[#0D1117]"><span className="font-medium">Eligible for org:</span> eligible@tcs.ng + any password</p>
            <p className="text-xs text-[#0D1117]"><span className="font-medium">Organization owner:</span> owner@tcs.ng + any password</p>
            <p className="text-xs text-[#0D1117]"><span className="font-medium">Reviewer:</span> reviewer@tcs.ng + any password</p>
            <p className="text-xs text-[#0D1117]"><span className="font-medium">Org reviewer (TCS internal):</span> org-reviewer@tcs.ng + any password</p>
          </div>
        </div>
      </div>
    </div>
  )
}
