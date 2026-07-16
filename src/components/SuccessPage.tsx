import { Button, Logo } from './ui'
import type { View, NavMeta } from '../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

export function SuccessPage({ navigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-[#F4F6FA] to-[#EEF2FF]">
      <div className="w-full max-w-lg text-center">
        {/* Animated checkmark */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-[#ECFDF5] animate-ping opacity-30" />
            <div className="relative w-24 h-24 rounded-full bg-[#ECFDF5] border-4 border-[#A7F3D0] flex items-center justify-center">
              <svg className="w-12 h-12 text-[#059669]" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M10 25l10 10L38 14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="display-font text-3xl font-bold text-[#0D1117] mb-3">
          Submission received!
        </h1>
        <p className="text-[#6B7280] text-base leading-relaxed mb-8 max-w-md mx-auto">
          Thank you, <span className="font-semibold text-[#0D1117]">Adaeze</span>. Your profile and identity documents have been submitted for review. Our compliance team will verify your information within <strong className="text-[#0D1117]">1–2 business days</strong>.
        </p>

        {/* Status timeline */}
        <div className="bg-white rounded-2xl border border-[#E2E6F0] shadow-sm p-6 mb-8 text-left">
          <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-5">What happens next</h2>
          <ol className="flex flex-col gap-0">
            {[
              { label: 'Submission received', detail: 'Your documents are safely stored and queued for review.', done: true, active: false },
              { label: 'Identity review', detail: 'Our compliance team checks your NIN and documents.', done: false, active: true },
              { label: 'Verification decision', detail: "You'll be notified by email and SMS with the outcome.", done: false, active: false },
              { label: 'Thrift eligibility unlocked', detail: 'Once verified, you can join or create thrift groups.', done: false, active: false },
            ].map((item, i, arr) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${item.done ? 'bg-[#059669]' : item.active ? 'bg-[#1746A2] ring-4 ring-[#C7D2FE]' : 'bg-[#F1F3F8] border-2 border-[#E2E6F0]'}`}>
                    {item.done ? (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                      </svg>
                    ) : item.active ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : null}
                  </div>
                  {i < arr.length - 1 && <div className={`w-px flex-1 min-h-[28px] mt-1 ${item.done ? 'bg-[#A7F3D0]' : 'bg-[#E2E6F0]'}`} />}
                </div>
                <div className="pb-5 pt-0.5">
                  <p className={`text-sm font-semibold ${item.done ? 'text-[#059669]' : item.active ? 'text-[#1746A2]' : 'text-[#9CA3AF]'}`}>{item.label}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('dashboard')} size="lg">
            Go to my dashboard
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('login')}>
            Sign out
          </Button>
        </div>

        <p className="text-xs text-[#9CA3AF] mt-6">
          Questions? Email us at{' '}
          <span className="text-[#1746A2] font-medium">support@tcs.ng</span>
          {' '}or call 0800-TCS-HELP
        </p>
      </div>
    </div>
  )
}
