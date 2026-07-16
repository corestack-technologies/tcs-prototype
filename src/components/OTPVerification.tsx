import { useState, useRef, useEffect } from 'react'
import { Logo, Button, Alert } from './ui'
import type { View, NavMeta } from '../App'

interface OTPVerificationProps { navigate: (v: View, meta?: NavMeta) => void }

export function OTPVerification({ navigate }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(59)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'email' | 'phone'>('email')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    pasted.split('').forEach((c, i) => { if (i < 6) next[i] = c })
    setOtp(next)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter all 6 digits.'); return }
    setError('')
    setLoading(true)
    setTimeout(() => { setLoading(false); navigate('onboarding') }, 1400)
  }

  const handleResend = () => {
    setOtp(['', '', '', '', '', ''])
    setResendTimer(59)
    setError('')
    inputs.current[0]?.focus()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo size="md" /></div>

        <div className="bg-white rounded-2xl border border-[#E2E6F0] shadow-sm p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#1746A2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M2 8l10 6 10-6" />
              </svg>
            </div>
          </div>

          <h1 className="display-font text-xl font-bold text-center text-[#0D1117] mb-1">Verify your contact</h1>
          <p className="text-center text-[#6B7280] text-sm mb-6 leading-relaxed">
            We sent a 6-digit code to your {mode === 'email' ? 'email address' : 'phone number'}.
            <br />
            <span className="font-medium text-[#0D1117]">
              {mode === 'email' ? 'ad***ze@email.com' : '+234 *** *** 5678'}
            </span>
          </p>

          {/* Toggle */}
          <div className="flex rounded-xl bg-[#F1F3F8] p-1 mb-6 gap-1">
            {(['email', 'phone'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setOtp(['', '', '', '', '', '']); setError('') }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === m ? 'bg-white text-[#1746A2] shadow-sm' : 'text-[#6B7280] hover:text-[#0D1117]'}`}
              >
                {m === 'email' ? '📧 Email' : '📱 Phone'}
              </button>
            ))}
          </div>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          {/* OTP inputs */}
          <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#1746A2] focus:border-transparent text-[#0D1117] ${digit ? 'border-[#1746A2] bg-[#EEF2FF]' : 'border-[#E2E6F0] bg-white'}`}
              />
            ))}
          </div>

          <Button onClick={handleVerify} size="lg" loading={loading} className="w-full mb-4">
            Verify & continue
          </Button>

          <p className="text-center text-sm text-[#6B7280]">
            Didn't receive a code?{' '}
            {resendTimer > 0 ? (
              <span className="font-medium text-[#9CA3AF]">Resend in {resendTimer}s</span>
            ) : (
              <button onClick={handleResend} className="text-[#1746A2] font-semibold hover:underline">
                Resend code
              </button>
            )}
          </p>
        </div>

        <p className="text-center text-sm text-[#9CA3AF] mt-5">
          <button onClick={() => navigate('signup')} className="hover:text-[#6B7280] transition-colors">
            ← Back to signup
          </button>
        </p>
      </div>
    </div>
  )
}
