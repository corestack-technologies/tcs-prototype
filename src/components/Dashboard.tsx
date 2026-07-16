import { useState } from 'react'
import { Logo, Badge, Button, Card, Alert } from './ui'
import type { View } from '../App'

interface Props { navigate: (v: View) => void }

type SectionStatus = 'not-started' | 'pending' | 'verified' | 'rejected'

interface Section {
  id: string
  label: string
  sublabel: string
  status: SectionStatus
  detail?: string
  icon: string
  action?: string
}

const SECTIONS: Section[] = [
  {
    id: 'profile',
    label: 'Basic profile',
    sublabel: 'Personal details and photo',
    status: 'verified',
    detail: 'Your profile is complete and verified.',
    icon: '👤',
  },
  {
    id: 'address',
    label: 'Residential address',
    sublabel: 'Home address on file',
    status: 'verified',
    detail: '14B Bode Thomas Street, Surulere, Lagos',
    icon: '🏠',
  },
  {
    id: 'identity',
    label: 'Identity verification',
    sublabel: 'NIN & supporting documents',
    status: 'pending',
    detail: 'Your documents are being reviewed. Estimated: 1–2 business days.',
    icon: '🪪',
    action: 'View status',
  },
  {
    id: 'bank',
    label: 'Bank information',
    sublabel: 'Payout account details',
    status: 'verified',
    detail: 'GTBank · 0123456789 · ADAEZE CHIDINMA OKONKWO',
    icon: '🏦',
  },
]

const statusBadge = (s: SectionStatus) => {
  const map: Record<SectionStatus, 'not-started' | 'pending' | 'verified' | 'rejected'> = {
    'not-started': 'not-started',
    pending: 'pending',
    verified: 'verified',
    rejected: 'rejected',
  }
  const label: Record<SectionStatus, string> = {
    'not-started': 'Not started',
    pending: 'Pending review',
    verified: 'Verified',
    rejected: 'Rejected',
  }
  return <Badge variant={map[s]}>{label[s]}</Badge>
}

function Sidebar({ navigate, active, setActive }: { navigate: (v: View) => void; active: string; setActive: (s: string) => void }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '◻' },
    { id: 'profile', label: 'My profile', icon: '👤' },
    { id: 'identity', label: 'Identity', icon: '🪪' },
    { id: 'bank', label: 'Bank info', icon: '🏦' },
    { id: 'groups', label: 'My groups', icon: '👥' },
  ]
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-[#E2E6F0] flex flex-col px-4 py-6 gap-1">
      <div className="px-2 mb-4"><Logo size="sm" /></div>
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active === item.id ? 'bg-[#EEF2FF] text-[#1746A2]' : 'text-[#6B7280] hover:bg-[#F1F3F8] hover:text-[#0D1117]'}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-[#E2E6F0] pt-4">
        <button
          onClick={() => navigate('login')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors w-full text-left"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function Dashboard({ navigate }: Props) {
  const [activeNav, setActiveNav] = useState('overview')
  const identityStatus = SECTIONS.find(s => s.id === 'identity')?.status ?? 'not-started'
  const allVerified = SECTIONS.every(s => s.status === 'verified')

  return (
    <div className="min-h-screen flex bg-[#F4F6FA]">
      <Sidebar navigate={navigate} active={activeNav} setActive={setActiveNav} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-[#E2E6F0] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="display-font text-lg font-bold text-[#0D1117]">My account</h1>
            <p className="text-xs text-[#6B7280]">Welcome back, Adaeze</p>
          </div>
          <div className="flex items-center gap-3">
            {!allVerified ? (
              <Badge variant="pending">Verification in progress</Badge>
            ) : (
              <Badge variant="verified">Eligible for thrift</Badge>
            )}
            <div className="w-8 h-8 rounded-full bg-[#1746A2] flex items-center justify-center text-white text-sm font-bold">A</div>
          </div>
        </div>

        <div className="flex-1 px-8 py-8 overflow-y-auto">
          {/* Eligibility banner */}
          {!allVerified && (
            <Alert type="warning" title="Verification pending" className="mb-6">
              Your identity is currently being reviewed. You'll be able to join or create thrift groups once all sections are verified.
            </Alert>
          )}

          {identityStatus === 'rejected' && (
            <Alert type="error" title="Identity documents rejected" className="mb-6">
              Your NIN slip was rejected because the image was unclear. Please resubmit with a clearer scan.{' '}
              <button className="underline font-semibold">Resubmit now →</button>
            </Alert>
          )}

          {/* Completion checklist */}
          <div className="mb-8">
            <h2 className="display-font text-base font-bold text-[#0D1117] mb-4">Account completion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECTIONS.map(section => (
                <div
                  key={section.id}
                  className={`bg-white rounded-xl border p-5 flex flex-col gap-3 transition-shadow hover:shadow-md ${section.status === 'rejected' ? 'border-[#FECACA]' : section.status === 'verified' ? 'border-[#A7F3D0]' : 'border-[#E2E6F0]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${section.status === 'verified' ? 'bg-[#ECFDF5]' : section.status === 'rejected' ? 'bg-[#FEF2F2]' : 'bg-[#F1F3F8]'}`}>
                        {section.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0D1117]">{section.label}</p>
                        <p className="text-xs text-[#6B7280]">{section.sublabel}</p>
                      </div>
                    </div>
                    {statusBadge(section.status)}
                  </div>
                  {section.detail && (
                    <p className="text-xs text-[#6B7280] leading-relaxed border-t border-[#F1F3F8] pt-3">{section.detail}</p>
                  )}
                  {(section.status === 'not-started' || section.status === 'rejected') && (
                    <Button
                      variant={section.status === 'rejected' ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => navigate('onboarding')}
                      className="self-start mt-1"
                    >
                      {section.status === 'rejected' ? 'Resubmit documents' : section.action ?? 'Complete now →'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Profile summary */}
          <div>
            <h2 className="display-font text-base font-bold text-[#0D1117] mb-4">Profile summary</h2>
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1746A2] to-[#3B82F6] flex items-center justify-center text-white text-2xl font-bold display-font">
                  A
                </div>
                <div>
                  <p className="display-font text-xl font-bold text-[#0D1117]">Adaeze Chidinma Okonkwo</p>
                  <p className="text-sm text-[#6B7280]">adaeze@email.com · +234 801 234 5678</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Member since July 2025</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#F1F3F8] pt-5">
                {[
                  { label: 'Date of birth', value: '14 Mar 1991' },
                  { label: 'Age', value: '34 years' },
                  { label: 'Preferred language', value: 'English' },
                  { label: 'Account status', value: 'Under review' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-[#0D1117] mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Groups placeholder */}
          <div className="mt-8">
            <h2 className="display-font text-base font-bold text-[#0D1117] mb-4">My thrift groups</h2>
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-10 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F1F3F8] flex items-center justify-center text-2xl mb-4">👥</div>
              <p className="text-sm font-semibold text-[#374151] mb-1">No groups yet</p>
              <p className="text-xs text-[#9CA3AF] mb-4 max-w-xs">Once your account is verified, you can join or create thrift groups to start coordinating contributions.</p>
              <Button variant="secondary" size="sm" disabled={!allVerified}>
                {allVerified ? 'Browse groups' : 'Available after verification'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
