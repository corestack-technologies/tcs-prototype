import { useState, type ReactNode } from 'react'
import { Logo } from '../ui'
import type { View, NavMeta } from '../../App'

interface AppShellProps {
  navigate: (v: View, meta?: NavMeta) => void
  activeView: View
  children: ReactNode
  userName?: string
  userInitials?: string
}

type NavGroup = {
  title: string
  items: { label: string; icon: string; view: View; badge?: number }[]
}

const icons = {
  home: 'M3 11.5L12 4l9 7.5M5 10.5V20h5v-5h4v5h5v-9.5',
  groups: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m14-10a4 4 0 100-8 4 4 0 000 8m6 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  discover: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35M13.5 8.5l-4 1.5-1.5 4 4-1.5 1.5-4z',
  history: 'M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8m0-5v5h5m4-1v5l3 2',
  profile: 'M20 21a8 8 0 10-16 0m8-10a4 4 0 100-8 4 4 0 000 8',
  pending: 'M12 8v5l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  signout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 18L18 6M6 6l12 12',
}

function SvgIcon({ path, className = 'h-4 w-4' }: { path: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export function AppShell({
  navigate,
  activeView,
  children,
  userName = 'Adaeze Okonkwo',
  userInitials = 'AO',
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', icon: icons.home, view: 'dashboard' }],
    },
    {
      title: 'Contributions',
      items: [
        { label: 'My groups', icon: icons.groups, view: 'my-groups' },
        { label: 'Contribution history', icon: icons.history, view: 'contribution-history' },
      ],
    },
    {
      title: 'Communities',
      items: [
        { label: 'Discover', icon: icons.discover, view: 'discover' },
        { label: 'Pending requests', icon: icons.pending, view: 'pending-approval', badge: 1 },
      ],
    },
    {
      title: 'Account',
      items: [{ label: 'Profile and identity', icon: icons.profile, view: 'dashboard' }],
    },
  ]

  const selectView = (view: View) => {
    navigate(view)
    setMobileOpen(false)
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--tcs-border)] px-5 py-5">
        <Logo size="sm" />
        <div className="mt-4 rounded-[var(--tcs-radius-md)] bg-[var(--tcs-brand-subtle)] px-3 py-3">
          <p className="text-xs font-bold text-[var(--tcs-brand-800)]">Member workspace</p>
          <p className="mt-1 text-[11px] leading-4 text-[var(--tcs-text-muted)]">Contributions, groups and payout visibility.</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map(group => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--tcs-text-faint)]">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(item => {
                const active = activeView === item.view
                return (
                  <button
                    key={item.label}
                    onClick={() => selectView(item.view)}
                    className={`flex w-full items-center gap-3 rounded-[var(--tcs-radius-sm)] px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[var(--tcs-brand)] text-white shadow-[var(--tcs-shadow-sm)]'
                        : 'text-[var(--tcs-text-soft)] hover:bg-[var(--tcs-surface-muted)] hover:text-[var(--tcs-text)]'
                    }`}
                  >
                    <SvgIcon path={item.icon} className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-[var(--tcs-text-muted)]'}`} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${active ? 'bg-white text-[var(--tcs-brand)]' : 'bg-[var(--tcs-warning-soft)] text-[#8a5b12]'}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--tcs-border)] px-4 py-4">
        <div className="flex items-center gap-3 rounded-[var(--tcs-radius-md)] bg-white px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-[var(--tcs-brand-900)] text-xs font-extrabold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--tcs-text)]">{userName}</p>
            <p className="text-xs text-[var(--tcs-text-muted)]">Active member</p>
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
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-[rgba(17,24,39,0.45)]" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <aside className="absolute inset-y-0 left-0 z-50 w-[280px] max-w-[82vw] bg-[var(--tcs-surface-raised)] shadow-[var(--tcs-shadow-lg)]">
            <Sidebar />
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
            {userInitials}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
