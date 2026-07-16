import { useEffect, useState } from 'react'
import { Button } from '../ui'
import { ORGANIZATION } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

const milestones = [
  { icon: '🏛', text: 'Organization profile created' },
  { icon: '👑', text: 'You are now Organization Owner' },
  { icon: '🔐', text: 'Owner workspace unlocked' },
  { icon: '📋', text: 'Ready to create your first group' },
]

export function OrgActivation({ navigate }: Props) {
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    milestones.forEach((_, i) => {
      setTimeout(() => setVisible(v => [...v, i]), 400 + i * 350)
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">

        {/* Celebration icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#1746A2]/10 animate-ping scale-150 opacity-30" />
            <div className="relative w-24 h-24 rounded-3xl bg-[#1746A2] flex items-center justify-center shadow-xl shadow-[#1746A2]/20">
              <span className="text-4xl">🏛</span>
            </div>
          </div>
        </div>

        <h1 className="display-font text-4xl font-black text-[#0D1117] mb-3">
          Your organization<br />is live!
        </h1>
        <p className="text-[#6B7280] text-base leading-relaxed mb-2">
          <strong className="text-[#1746A2]">{ORGANIZATION.name}</strong> has been created on TCS.
        </p>
        <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
          You are now the Organization Owner. Your workspace is ready — create your first group, invite members, and start your first cycle.
        </p>

        {/* Milestone list */}
        <div className="flex flex-col gap-3 mb-10 text-left">
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-5 py-3.5 bg-white rounded-xl border border-[#E2E6F0] transition-all duration-500 ${visible.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
              <span className="text-xl">{m.icon}</span>
              <p className="text-sm font-semibold text-[#0D1117]">{m.text}</p>
              {visible.includes(i) && (
                <div className="ml-auto w-5 h-5 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-[#059669]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate('owner-dashboard')}
        >
          Enter My Organization →
        </Button>
        <p className="text-xs text-[#9CA3AF] mt-4">
          You can switch between your member view and owner workspace at any time.
        </p>
      </div>
    </div>
  )
}
