import { Button } from '../ui'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  communityId?: string
}

export function JoinRequestSubmitted({ navigate, communityId }: Props) {
  return (
    <AppShell navigate={navigate} activeView="discover">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Animated success indicator */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#EEF2FF] animate-ping opacity-20 scale-125" />
              <div className="relative w-20 h-20 rounded-2xl bg-[#EEF2FF] border-2 border-[#C7D2FE] flex items-center justify-center">
                <svg className="w-10 h-10 text-[#1746A2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">
              Request sent!
            </h1>
            <p className="text-[#6B7280] text-sm leading-relaxed max-w-md mx-auto">
              Your request to join <strong className="text-[#0D1117]">Mainland Savers Club</strong> has been sent to the coordinator. You'll hear back within <strong className="text-[#0D1117]">48 hours</strong>.
            </p>
          </div>

          {/* What happens next */}
          <div className="bg-white rounded-2xl border border-[#E2E6F0] p-6 mb-6">
            <h2 className="display-font text-sm font-bold text-[#9CA3AF] uppercase tracking-wide mb-5">What happens next</h2>
            <ol className="flex flex-col gap-0">
              {[
                {
                  label: 'Request received',
                  detail: 'Emeka Nwosu has been notified and will review your profile.',
                  done: true,
                  active: false,
                },
                {
                  label: 'Coordinator review',
                  detail: 'Emeka will review your introduction and TCS profile (1–48 hours).',
                  done: false,
                  active: true,
                },
                {
                  label: 'Decision notification',
                  detail: "You'll receive a TCS notification and SMS with the outcome.",
                  done: false,
                  active: false,
                },
                {
                  label: 'Position assigned',
                  detail: "If approved, you'll receive your position number and first contribution due date.",
                  done: false,
                  active: false,
                },
              ].map((step, i, arr) => (
                <li key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${step.done ? 'bg-[#059669]' : step.active ? 'bg-[#1746A2] ring-4 ring-[#C7D2FE]' : 'bg-[#F1F3F8] border-2 border-[#E2E6F0]'}`}>
                      {step.done ? (
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                        </svg>
                      ) : step.active ? (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      ) : null}
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`w-px flex-1 min-h-[28px] mt-1 ${step.done ? 'bg-[#A7F3D0]' : 'bg-[#E2E6F0]'}`} />
                    )}
                  </div>
                  <div className="pb-5 pt-0.5">
                    <p className={`text-sm font-semibold ${step.done ? 'text-[#059669]' : step.active ? 'text-[#1746A2]' : 'text-[#9CA3AF]'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Request details summary */}
          <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-5 py-4 mb-7">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Request summary</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Community', value: 'Mainland Savers Club' },
                { label: 'Coordinator', value: 'Emeka Nwosu' },
                { label: 'Monthly contribution', value: '₦50,000' },
                { label: 'Request submitted', value: 'Now · 29 Jul 2025' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-semibold text-[#0D1117] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate('pending-approval')} size="lg" className="flex-1">
              View pending requests
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('dashboard')} className="flex-1">
              Back to dashboard
            </Button>
          </div>

          <p className="text-center text-xs text-[#9CA3AF] mt-5">
            Want to explore more?{' '}
            <button onClick={() => navigate('discover')} className="text-[#1746A2] font-semibold hover:underline">
              Discover other communities
            </button>
          </p>
        </div>
      </div>
    </AppShell>
  )
}
