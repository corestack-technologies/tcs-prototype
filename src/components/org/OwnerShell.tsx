import { useState } from 'react'
import { Logo } from '../ui'
import { ORGANIZATION, JOIN_REQUESTS, VERIFICATION_QUEUE } from './data'
import type { View, NavMeta } from '../../App'

interface NavItem { label: string; icon: string; view: View; badge?: number }
interface NavGroup { title: string; items: NavItem[] }

const icons = {
  dashboard: 'M3 11.5L12 4l9 7.5M5 10.5V20h5v-5h4v5h5v-9.5',
  groups: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m14-10a4 4 0 100-8 4 4 0 000 8m6 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  cycles: 'M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0012 3M19 9A7 7 0 007 6',
  requests: 'M18 9v6m3-3h-6M13 7a4 4 0 11-8 0 4 4 0 018 0zM3 21a6 6 0 0112 0',
  verify: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  payouts: 'M3 7h18v10H3V7zm3-3h12m-6 6a2 2 0 100 4 2 2 0 000-4z',
  profile: 'M4 21V5a2 2 0 012-2h12a2 2 0 012 2v16M8 7h8M8 11h8M8 15h4',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.51 1.7 1.7 0 001.88-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.13.37.5.63.91.63H21a2 2 0 110 4h-.69c-.41 0-.78.26-.91.63z',
  signout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu: 'M4 6h16M4 12h16M4 18h16',
  member: 'M20 21a8 8 0 10-16 0m8-10a4 4 0 100-8 4 4 0 000 8',
}

function SvgIcon({ path, className = 'h-4 w-4' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  activeView: View
  children: React.ReactNode
}

const pendingRequests = JOIN_REQUESTS.filter(r => r.status === 'pending').length
const pendingVerifications = VERIFICATION_QUEUE.filter(v => v.status === 'pending').length

export function OwnerShell({ navigate, activeView, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', icon: icons.dashboard, view: 'owner-dashboard' }],
    },
    {
      title: 'Groups',
      items: [
        { label: 'My groups', icon: icons.groups, view: 'owner-groups' },
        { label: 'Active cycles', icon: icons.cycles, view: 'owner-cycles' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Collection operations', icon: icons.cycles, view: 'owner-collection' },
        { label: 'Contribution exceptions', icon: icons.verify, view: 'owner-verification', badge: pendingVerifications || undefined },
        { label: 'Upcoming payouts', icon: icons.payouts, view: 'owner-payouts' },
      ],
    },
    {
      title: 'Members',
      items: [
        { label: 'Join requests', icon: icons.requests, view: 'owner-join-requests', badge: pendingRequests || undefined },
      ],
    },
    {
      title: 'Organization',
      items: [
        { label: 'Profile', icon: icons.profile, view: 'owner-profile' },
        { label: 'Settings', icon: icons.settings, view: 'owner-settings' },
      ],
    },
  ]

  const selectView = (view: View) => {
    navigate(view)
    setMobileOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--tcs-border)] px-5 py-5">
        <Logo size="sm" />
        <div className="mt-4 rounded-[var(--tcs-radius-md)] border border-[#c7d6f6] bg-[var(--tcs-brand-subtle)] p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-[var(--tcs-brand)] text-[11px] font-extrabold text-white">
              {ORGANIZATION.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-[var(--tcs-text)]">{ORGANIZATION.name}</p>
              <p className="text-[11px] text-[var(--tcs-text-muted)]">Organization owner</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map(group => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--tcs-text-faint)]">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = activeView === item.view
                return (
                  <button
                    key={item.view}
                    onClick={() => selectView(item.view)}
                    className={`flex w-full items-center gap-3 rounded-[var(--tcs-radius-sm)] px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[var(--tcs-brand)] text-white shadow-[var(--tcs-shadow-sm)]'
                        : 'text-[var(--tcs-text-soft)] hover:bg-[var(--tcs-surface-muted)] hover:text-[var(--tcs-text)]'
                    }`}
                  >
                    <SvgIcon path={item.icon} className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--tcs-text-muted)]'}`} />
                    <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                    {item.badge != null && (
                      <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${isActive ? 'bg-white text-[var(--tcs-brand)]' : 'bg-[var(--tcs-danger-soft)] text-[var(--tcs-danger)]'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="mt-2 border-t border-[var(--tcs-border)] pt-3">
          <button
            onClick={() => selectView('dashboard')}
            className="flex w-full items-center gap-3 rounded-[var(--tcs-radius-sm)] px-3 py-2.5 text-sm font-semibold text-[var(--tcs-text-muted)] transition-colors hover:bg-[var(--tcs-surface-muted)] hover:text-[var(--tcs-text)]"
          >
            <SvgIcon path={icons.member} />
            Member view
          </button>
        </div>
      </nav>

      <div className="border-t border-[var(--tcs-border)] px-4 py-4">
        <div className="flex items-center gap-3 rounded-[var(--tcs-radius-md)] bg-white px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-[var(--tcs-brand-900)] text-xs font-extrabold text-white">
            {ORGANIZATION.owner.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--tcs-text)]">{ORGANIZATION.owner.name}</p>
            <p className="truncate text-xs text-[var(--tcs-text-muted)]">{ORGANIZATION.owner.email}</p>
          </div>
          <button
            onClick={() => navigate('login')}
            className="rounded-[var(--tcs-radius-sm)] p-2 text-[var(--tcs-text-faint)] transition-colors hover:bg-[var(--tcs-danger-soft)] hover:text-[var(--tcs-danger)]"
            title="Sign out"
          >
            <SvgIcon path={icons.signout} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--tcs-bg-cool)]">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--tcs-border)] bg-[var(--tcs-surface-raised)] lg:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-[rgba(17,24,39,0.45)]" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <aside className="absolute inset-y-0 left-0 z-50 w-[290px] max-w-[84vw] bg-[var(--tcs-surface-raised)] shadow-[var(--tcs-shadow-lg)]">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--tcs-border)] bg-[var(--tcs-surface-raised)] px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-[var(--tcs-radius-sm)] p-2 text-[var(--tcs-text-soft)] hover:bg-[var(--tcs-surface-muted)]" aria-label="Open navigation">
            <SvgIcon path={icons.menu} className="h-5 w-5" />
          </button>
          <Logo size="sm" />
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-[var(--tcs-brand-900)] text-xs font-extrabold text-white">
            {ORGANIZATION.owner.initials}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
