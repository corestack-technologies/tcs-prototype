import { useState } from 'react'
import { Logo } from '../ui'
import { ORGANIZATION, JOIN_REQUESTS, VERIFICATION_QUEUE } from './data'
import type { View, NavMeta } from '../../App'

interface NavItem { label: string; icon: string; view: View; badge?: number }
interface NavGroup { title: string; items: NavItem[] }

const icons = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  groups: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  cycles: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  requests: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  verify: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  payouts: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  profile: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  signout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 18L18 6M6 6l12 12',
  member: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
}

function SvgIcon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  const parts = path.split(' M ').flatMap((p, i) => i === 0 ? [p] : ['M ' + p])
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      {parts.map((d, i) => <path key={i} d={d} />)}
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
        { label: 'My Groups', icon: icons.groups, view: 'owner-groups' },
        { label: 'Active Cycles', icon: icons.cycles, view: 'owner-cycles' },
      ],
    },
    {
      title: 'Members',
      items: [
        { label: 'Join Requests', icon: icons.requests, view: 'owner-join-requests', badge: pendingRequests || undefined },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Collection Operations', icon: icons.cycles, view: 'owner-collection' },
        { label: 'Contribution Exceptions', icon: icons.verify, view: 'owner-verification', badge: pendingVerifications || undefined },
        { label: 'Upcoming Payouts', icon: icons.payouts, view: 'owner-payouts' },
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + org name */}
      <div className="px-5 pt-6 pb-5 border-b border-[#E2E6F0]">
        <Logo />
        <div className="mt-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1746A2] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {ORGANIZATION.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#0D1117] truncate leading-tight">{ORGANIZATION.name}</p>
            <p className="text-[10px] text-[#9CA3AF] leading-tight">Organization Owner</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map(group => (
          <div key={group.title} className="mb-5">
            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{group.title}</p>
            {group.items.map(item => {
              const isActive = activeView === item.view
              return (
                <button
                  key={item.view}
                  onClick={() => { navigate(item.view); setMobileOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors mb-0.5 ${isActive ? 'bg-[#EEF2FF] text-[#1746A2]' : 'text-[#374151] hover:bg-[#F4F6FA] hover:text-[#0D1117]'}`}
                >
                  <SvgIcon path={item.icon} className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#1746A2]' : 'text-[#6B7280]'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge != null && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        {/* Switch to member view */}
        <div className="border-t border-[#E2E6F0] pt-3 mt-2">
          <button
            onClick={() => navigate('dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B7280] hover:bg-[#F4F6FA] transition-colors"
          >
            <SvgIcon path={icons.member} className="w-4 h-4 shrink-0" />
            Member view
          </button>
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 pb-5 border-t border-[#E2E6F0] pt-4">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#1746A2] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {ORGANIZATION.owner.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0D1117] truncate">{ORGANIZATION.owner.name}</p>
            <p className="text-xs text-[#9CA3AF] truncate">{ORGANIZATION.owner.email}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('login')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#6B7280] hover:bg-[#F4F6FA] transition-colors"
        >
          <SvgIcon path={icons.signout} className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#F4F6FA] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-[#E2E6F0] shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden bg-white border-b border-[#E2E6F0] px-4 py-3 flex items-center justify-between shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-[#F4F6FA]">
            <SvgIcon path={icons.menu} className="w-5 h-5 text-[#374151]" />
          </button>
          <Logo />
          <div className="w-8 h-8 rounded-full bg-[#1746A2] flex items-center justify-center text-xs font-bold text-white">
            {ORGANIZATION.owner.initials}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
