import { useState } from 'react'
import { Button, Alert } from '../ui'
import { AppShell } from '../thrift/AppShell'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  status?: 'submitted' | 'pending' | 'info-required' | 'approved' | 'rejected'
}

export function OrgReviewStatus({ navigate, status = 'submitted' }: Props) {
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [infoSubmitted, setInfoSubmitted] = useState(false)

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!additionalInfo.trim()) return
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setInfoSubmitted(true) }, 1400)
  }

  return (
    <AppShell navigate={navigate} activeView="dashboard">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-[#0D1117]">Organization application</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-10">
        <div className="max-w-lg mx-auto">

          {/* ── Submitted ─────────────────────────────────────────────────── */}
          {status === 'submitted' && (
            <div className="text-center">
              <div className="flex justify-center mb-7">
                <div className="w-20 h-20 rounded-2xl bg-[#EEF2FF] border-2 border-[#C7D2FE] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#1746A2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">Application submitted</h1>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
                Thank you for applying. Your organization application has been received and is now in the review queue.
              </p>

              {/* Reference */}
              <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] p-5 mb-7 text-left">
                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Application receipt</p>
                {[
                  { label: 'Application ID', value: 'TCS-ORG-2025-00847' },
                  { label: 'Submitted', value: '1 Aug 2025, 11:34 AM' },
                  { label: 'Review target', value: '3–5 business days' },
                  { label: 'Status', value: 'Under review' },
                ].map((r, i, arr) => (
                  <div key={i} className={`flex justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-[#E2E6F0]' : ''}`}>
                    <p className="text-xs text-[#6B7280]">{r.label}</p>
                    <p className="text-xs font-semibold text-[#0D1117]">{r.value}</p>
                  </div>
                ))}
              </div>

              <Alert type="info" className="mb-6 text-left">
                You will be notified by email when your application status changes. You can check back here at any time.
              </Alert>

              <Button size="lg" className="w-full" onClick={() => navigate('dashboard')}>
                Back to dashboard
              </Button>
            </div>
          )}

          {/* ── Pending Review ────────────────────────────────────────────── */}
          {status === 'pending' && (
            <div className="text-center">
              <div className="flex justify-center mb-7">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-[#FFFBEB] border-2 border-[#FDE68A] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#D97706] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">Under review</h1>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-7">
                Your application <strong className="font-mono text-[#0D1117]">TCS-ORG-2025-00847</strong> is being reviewed by the TCS team. This typically takes 3–5 business days.
              </p>

              {/* Progress */}
              <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-6 text-left">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Review progress</p>
                {[
                  { step: 'Application received', done: true, date: '1 Aug 2025' },
                  { step: 'Initial screening', done: true, date: '2 Aug 2025' },
                  { step: 'Detailed review', done: false, active: true, date: 'In progress' },
                  { step: 'Final decision', done: false, date: 'Pending' },
                ].map((s, i, arr) => (
                  <div key={i} className="flex gap-3 mb-3 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-[#059669]' : s.active ? 'bg-[#D97706]' : 'bg-[#E2E6F0]'}`}>
                        {s.done && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" /></svg>}
                        {s.active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {i < arr.length - 1 && <div className="w-px flex-1 min-h-[16px] mt-0.5 bg-[#E2E6F0]" />}
                    </div>
                    <div className="pb-2 flex-1 flex items-start justify-between">
                      <p className={`text-sm font-semibold ${s.done ? 'text-[#059669]' : s.active ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>{s.step}</p>
                      <p className="text-xs text-[#9CA3AF]">{s.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate('dashboard')}>
                Back to dashboard
              </Button>
            </div>
          )}

          {/* ── Information Required ──────────────────────────────────────── */}
          {status === 'info-required' && (
            <div>
              {!infoSubmitted ? (
                <>
                  <div className="flex justify-center mb-7">
                    <div className="w-20 h-20 rounded-2xl bg-[#FFFBEB] border-2 border-[#FDE68A] flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2 text-center">Additional information needed</h1>
                  <p className="text-[#6B7280] text-sm leading-relaxed mb-6 text-center">
                    The TCS review team has reviewed your application and requires some additional information before a decision can be made.
                  </p>

                  <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] p-5 mb-6">
                    <p className="text-xs font-bold text-[#92400E] uppercase tracking-wide mb-2">Reviewer note</p>
                    <p className="text-sm text-[#92400E] leading-relaxed">
                      Thank you for your application. We would like to verify the size of your existing thrift group. Could you please provide a list of your current members (names only) and confirm the contribution amount and frequency for your main group?
                    </p>
                    <p className="text-xs text-[#D97706] mt-3">— TCS Review Team · 4 Aug 2025</p>
                  </div>

                  <form onSubmit={handleSubmitInfo} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#0D1117]">Your response <span className="text-[#DC2626]">*</span></label>
                      <textarea
                        value={additionalInfo}
                        onChange={e => setAdditionalInfo(e.target.value)}
                        rows={6}
                        placeholder="Provide the requested information here…"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none"
                      />
                    </div>
                    <Button type="submit" size="lg" loading={submitting} className="w-full">
                      Submit additional information
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-7">
                    <div className="w-20 h-20 rounded-2xl bg-[#ECFDF5] border-2 border-[#A7F3D0] flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">Information submitted</h1>
                  <p className="text-[#6B7280] text-sm leading-relaxed mb-6">Your additional information has been sent to the TCS review team. We will notify you once a decision has been made.</p>
                  <Button size="lg" className="w-full" onClick={() => navigate('dashboard')}>Back to dashboard</Button>
                </div>
              )}
            </div>
          )}

          {/* ── Approved ──────────────────────────────────────────────────── */}
          {status === 'approved' && (
            <div className="text-center">
              <div className="flex justify-center mb-7">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#ECFDF5] animate-ping opacity-20 scale-150" />
                  <div className="relative w-20 h-20 rounded-2xl bg-[#ECFDF5] border-2 border-[#6EE7B7] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">Application approved!</h1>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-7">
                Congratulations — your organization application has been approved by TCS. You can now activate your organization and begin setting up your first group.
              </p>
              <div className="bg-[#ECFDF5] rounded-xl border border-[#A7F3D0] p-5 mb-7 text-left">
                {[
                  { label: 'Application ID', value: 'TCS-ORG-2025-00847' },
                  { label: 'Decision date', value: '6 Aug 2025' },
                  { label: 'Organization name', value: 'Adaeze Thrift Network' },
                  { label: 'Your role', value: 'Organization Owner' },
                ].map((r, i, arr) => (
                  <div key={i} className={`flex justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-[#A7F3D0]' : ''}`}>
                    <p className="text-xs text-[#065F46]">{r.label}</p>
                    <p className="text-xs font-semibold text-[#059669]">{r.value}</p>
                  </div>
                ))}
              </div>
              <Button size="lg" variant="success" className="w-full" onClick={() => navigate('org-activation')}>
                Activate my organization →
              </Button>
            </div>
          )}

          {/* ── Rejected ──────────────────────────────────────────────────── */}
          {status === 'rejected' && (
            <div>
              <div className="flex justify-center mb-7">
                <div className="w-20 h-20 rounded-2xl bg-[#FEF2F2] border-2 border-[#FECACA] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#DC2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2 text-center">Application not approved</h1>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-6 text-center">
                After careful review, TCS was unable to approve your organization application at this time.
              </p>

              <div className="bg-[#FEF2F2] rounded-xl border border-[#FECACA] p-5 mb-6">
                <p className="text-xs font-bold text-[#991B1B] uppercase tracking-wide mb-2">Reason for decision</p>
                <p className="text-sm text-[#991B1B] leading-relaxed">
                  We were unable to verify the membership size and activity level described in your application. Our policy requires applicants to have operated a thrift group with at least 5 active members for a minimum of 3 months prior to applying.
                </p>
                <p className="text-xs text-[#DC2626] mt-3">— TCS Review Team · 6 Aug 2025</p>
              </div>

              <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] p-5 mb-6">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">What you can do</p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    'Continue as a TCS member and build your contribution history.',
                    'Once your group has been active for 3+ months, resubmit your application with updated records.',
                    'Contact TCS support if you believe this decision was made in error.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                      <span className="w-5 h-5 rounded-full bg-[#EEF2FF] text-[#1746A2] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button size="lg" className="w-full" onClick={() => navigate('org-application')}>
                  Resubmit application
                </Button>
                <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate('dashboard')}>
                  Back to dashboard
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
