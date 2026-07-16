import { type ReactNode } from 'react'
import { Logo } from '../ui'
import type { View, NavMeta } from '../../App'

interface AppShellProps {
  navigate: (v: View, meta?: NavMeta) => void
  activeView: View
  children: ReactNode
  userName?: string
  userInitials?: string
}

const Icon = ({ d, viewBox = '0 0 16 16' }: { d: string; viewBox?: string }) => (
  <svg className="w-4 h-4" viewBox={viewBox} fill="currentColor"><path d={d} /></svg>
)

const icons = {
  home: 'M8.354 1.146a.5.5 0 00-.708 0l-6 6A.5.5 0 002 7.5V14a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-3h2v3a.5.5 0 00.5.5h4a.5.5 0 00.5-.5V7.5a.5.5 0 00-.146-.354L8.354 1.146z',
  groups: 'M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 017 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002H7.022zM11 7a2 2 0 100-4 2 2 0 000 4zM6.956 9.448A3.999 3.999 0 016 8c0-.85.229-1.648.629-2.334A3 3 0 100 8.5c0 1.085.448 2.068 1.17 2.772A5.036 5.036 0 016.956 9.448zM1 8a2 2 0 112.685 1.878 4.98 4.98 0 01-.276-.52A2 2 0 011 8z',
  discover: 'M9.5 13a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm0-1a5.5 5.5 0 100-11 5.5 5.5 0 000 11zm1.55-8.42l-3.74 1.56 1.56 3.74 3.74-1.56-1.56-3.74zm-1.35 3.4a1 1 0 110-2 1 1 0 010 2z',
  calendar: 'M3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v10a1 1 0 001 1h12a1 1 0 001-1V4H1zm2 2h2v2H3V6zm4 0h2v2H7V6zm4 0h2v2h-2V6zM3 10h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2z',
  history: 'M8.515 1.019A7 7 0 008 1V0a8 8 0 110 16A8 8 0 011.271 3.5l.64.775A7 7 0 108.515 1.019zM8 4.5v4l3 3-.75.75L7 9V4.5H8z',
  clock: 'M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5zM8 16A8 8 0 118 0a8 8 0 010 16z',
  payout: 'M1 3a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V3zm1 0v7h12V3H2zm6.5 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 5.5a.5.5 0 110-1 .5.5 0 010 1zm10 0a.5.5 0 110-1 .5.5 0 010 1z',
  timeline: 'M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM7.5 4v5l3.5 2-.75 1.25L6.5 9.5V4h1z',
  profile: 'M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z',
  pending: 'M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM7.25 5.5v3.25l2.5 1.5.75-1.25-2-1.2V5.5h-1.25z',
  signout: 'M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6',
}

type NavGroup = {
  title: string
  items: { label: string; icon: string; view: View; badge?: number }[]
}

export function AppShell({
  navigate,
  activeView,
  children,
  userName = 'Adaeze Okonkwo',
  userInitials = 'AO',
}: AppShellProps) {
  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: icons.home, view: 'dashboard' },
      ],
    },
    {
      title: 'My contributions',
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
      items: [
        { label: 'Profile & identity', icon: icons.profile, view: 'dashboard' },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex bg-[#F4F6FA]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-[#E2E6F0]">
        <div className="px-5 py-5 border-b border-[#E2E6F0]">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-5">
          {navGroups.map(group => (
            <div key={group.title}>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest px-3 mb-1.5">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(item => {
                  const active = activeView === item.view
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.view)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left group ${
                        active
                          ? 'bg-[#EEF2FF] text-[#1746A2]'
                          : 'text-[#6B7280] hover:bg-[#F1F3F8] hover:text-[#0D1117]'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <svg
                          className={`w-4 h-4 shrink-0 ${active ? 'text-[#1746A2]' : 'text-[#9CA3AF] group-hover:text-[#6B7280]'}`}
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d={item.icon} />
                        </svg>
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
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

        <div className="border-t border-[#E2E6F0] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1746A2] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0D1117] truncate">{userName}</p>
              <p className="text-[10px] text-[#9CA3AF]">Active member</p>
            </div>
            <button
              onClick={() => navigate('login')}
              className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
              title="Sign out"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d={icons.signout} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden bg-white border-b border-[#E2E6F0] px-5 py-3.5 flex items-center justify-between shrink-0">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-[#F1F3F8]">
              <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.5 2h11a.5.5 0 010 1h-11a.5.5 0 010-1zm0 5h11a.5.5 0 010 1h-11a.5.5 0 010-1zm0 5h11a.5.5 0 010 1h-11a.5.5 0 010-1z" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1746A2] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
