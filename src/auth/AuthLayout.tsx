import type { ReactNode } from 'react'
import { Logo } from '../components/ui'
import './auth.css'

/** Replace this component's graphic with an approved local image; keep its aspect ratio. */
export function AuthHeroVisual() {
  return <div className="auth-hero-visual" aria-hidden="true"><svg viewBox="0 0 480 220" fill="none"><circle cx="240" cy="112" r="87" stroke="white" strokeOpacity=".18"/><circle cx="240" cy="112" r="62" stroke="white" strokeOpacity=".25" strokeDasharray="4 8"/><path d="M117 155L180 96L241 123L309 58L370 83" stroke="#BCD4FF" strokeWidth="3" strokeLinecap="round"/><rect x="196" y="66" width="88" height="108" rx="18" fill="white"/><path d="M218 127c0-13 10-23 22-23s22 10 22 23M218 139h44" stroke="#1554C0" strokeWidth="4" strokeLinecap="round"/><circle cx="240" cy="95" r="9" fill="#D6E5FF" stroke="#1554C0" strokeWidth="3"/>{[[117,155],[180,96],[309,58],[370,83]].map(([x,y])=><g key={x}><circle cx={x} cy={y} r="17" fill="#BCD4FF"/><circle cx={x} cy={y-3} r="5" fill="#1554C0"/><path d={`M${x-8} ${y+9}q8-13 16 0`} stroke="#1554C0" strokeWidth="3"/></g>)}</svg></div>
}
export function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className="auth-layout"><a className="sr-only focus:not-sr-only" href="#auth-main">Skip to content</a><aside className="auth-hero"><div className="auth-wordmark"><strong>TCS</strong><span>Thrift Core System</span></div><div><AuthHeroVisual/><h2>Move forward.<br/>Together.</h2><p>Your community, your contributions, your next step. Keep them connected with TCS.</p><ul><li>Community participation</li><li>Clear progress</li><li>One Member profile</li></ul></div><span className="auth-hero-signoff">Built around everyday ambition.</span></aside><main id="auth-main" className={`auth-main ${wide ? 'auth-main-wide' : ''}`}><div className="auth-mobile-brand"><Logo/></div>{children}</main></div>
}
export function EntryProgress({ current }: { current: number }) {
  return <ol className="auth-progress" aria-label="Account setup progress">{['Account', 'Contact', 'Profile', 'Verification'].map((label,i)=><li key={label} aria-current={i===current?'step':undefined}><span aria-hidden="true">{i+1}</span>{label}</li>)}</ol>
}
