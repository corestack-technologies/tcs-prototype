import { useEffect, useState } from 'react'
import { Button } from '../ui'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

const STATS = [
  { label: 'Cycle number', value: '#1' },
  { label: 'Total positions', value: '12' },
  { label: 'Active members', value: '8' },
  { label: 'Collection start', value: 'Aug 1, 2026' },
  { label: 'First contribution due', value: 'Aug 8, 2026' },
  { label: 'First payout date', value: 'Aug 11, 2026' },
]

const CONFETTI_COLORS = [
  '#1746A2', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2',
  '#16A34A', '#EA580C', '#4F46E5', '#0D9488',
]

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  rotation: number
  speed: number
  drift: number
  shape: 'rect' | 'circle'
}

function ConfettiCanvas() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 40,
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      speed: 0.4 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))
  )
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => {
        const y = ((p.y + tick * p.speed) % 120)
        const x = p.x + Math.sin(tick * 0.02 + p.id) * p.drift
        return (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.shape === 'circle' ? p.size : p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : 2,
              transform: `rotate(${p.rotation + tick * 3}deg)`,
              opacity: y > 95 ? (120 - y) / 25 : 0.85,
            }}
          />
        )
      })}
    </div>
  )
}

export function GroupActivated({ navigate }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <ConfettiCanvas />

      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-[#1746A2]/10 blur-3xl" />
      </div>

      <div
        className={`relative z-10 max-w-xl w-full flex flex-col items-center text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-[#059669] flex items-center justify-center mb-6 shadow-2xl shadow-[#059669]/30 ring-8 ring-[#059669]/20">
          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Text */}
        <div className={`transition-all duration-700 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xs font-bold text-[#34D399] uppercase tracking-widest mb-3">Cycle activated</p>
          <h1 className="display-font text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
            Victoria Island<br />Monthly Ajo is live.
          </h1>
          <p className="text-[#9CA3AF] text-base leading-relaxed max-w-sm mx-auto mb-8">
            Your first cycle has been successfully launched. Members will be notified and can begin submitting contributions from August 1.
          </p>
        </div>

        {/* Stats grid */}
        <div
          className={`w-full grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {STATS.map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center">
              <p className="display-font text-xl font-bold text-white mb-0.5">{s.value}</p>
              <p className="text-xs text-[#9CA3AF]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`flex flex-col sm:flex-row gap-3 w-full transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <Button
            size="lg"
            variant="success"
            onClick={() => navigate('owner-dashboard')}
            className="flex-1"
          >
            Go to Organization Dashboard
          </Button>
          <button
            onClick={() => navigate('owner-groups')}
            className="flex-1 px-6 py-3.5 text-sm font-semibold text-white/60 hover:text-white border border-white/10 rounded-xl hover:border-white/30 transition-colors"
          >
            View my groups
          </button>
        </div>

        {/* Footer note */}
        <div
          className={`mt-8 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-[#9CA3AF] leading-relaxed text-left w-full transition-all duration-700 delay-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <p className="text-white font-semibold mb-1">What happens next?</p>
          <ul className="flex flex-col gap-1.5">
            {[
              'Members receive a notification with their contribution schedule and payout position.',
              'The first contribution window opens on August 1 and closes August 8.',
              'After the collection window closes, verify submitted payment references in your dashboard.',
              'Record the payout as sent once the collection is verified and coordinated.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#34D399] shrink-0 font-semibold">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
