import { useState } from 'react'
import { Button, Alert } from '../ui'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void; clientId?: string }

type ReviewAction = 'approve' | 'reject' | 'request-info' | null

const APPLICATION = {
  id: 'app-002',
  orgName: 'Surulere Women Ajo Circle',
  applicantName: 'Ngozi Adeyemi',
  applicantEmail: 'ngozi.a@gmail.com',
  applicantPhone: '+234 802 345 6789',
  orgType: 'Rotating Savings Group (Ajo / Esusu)',
  location: 'Surulere, Lagos State',
  estimatedMembers: 15,
  frequency: 'Monthly',
  avgContribution: '₦20,000',
  submittedDate: 'Jul 10, 2026',
  status: 'info-required' as const,
  description: 'We are a group of 15 women from Surulere who have been running a monthly Ajo for the past 3 years. We manage our records via WhatsApp. We want to move to a more structured system that all members can trust and that keeps clear records.',
  existingProcess: 'WhatsApp group records',
  meetingSchedule: 'Monthly in-person',
  whyDigitize: 'We have had issues with trust in the past — two members disputed their payout records. We believe a digital system will eliminate these conflicts and make everyone feel safe.',
  challenges: 'Some members are not smartphone-savvy. We need a solution that is simple enough for older members to use.',
  expectedBenefits: 'Transparent records, automated reminders, and proper receipts for each contribution.',
  infoRequested: 'Please provide proof of identity (National ID, Voter\'s Card, or International Passport) and a list of your existing group members with their phone numbers.',
  eligibilityCheck: {
    accountVerified: true,
    minContributionHistory: true,
    noActiveDisputes: true,
    referralVerified: false,
    govtIdSubmitted: false,
  },
  history: [
    { date: 'Jul 10, 2026', action: 'Application submitted', by: 'Ngozi Adeyemi', note: '' },
    { date: 'Jul 11, 2026', action: 'Info requested', by: 'Reviewer (TCS)', note: 'Requested proof of identity and member list.' },
  ],
}

export function OrgApplicationDetail({ navigate }: Props) {
  const [action, setAction] = useState<ReviewAction>(null)
  const [infoNote, setInfoNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [done, setDone] = useState<'approved' | 'rejected' | 'info-sent' | null>(null)

  const submit = () => {
    if (action === 'approve') setDone('approved')
    else if (action === 'reject' && rejectReason.trim()) setDone('rejected')
    else if (action === 'request-info' && infoNote.trim()) setDone('info-sent')
  }

  const check = APPLICATION.eligibilityCheck

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-10 py-4 flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate('org-review-queue')}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Application queue
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117] truncate">{APPLICATION.orgName}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-semibold text-[#1746A2] bg-[#EEF2FF] px-2.5 py-1 rounded-full">Info required</span>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">

          {done === 'approved' && (
            <Alert type="success">Application approved. The applicant will be notified and their organization will be activated.</Alert>
          )}
          {done === 'rejected' && (
            <Alert type="error">Application rejected. The applicant has been notified with the reason provided.</Alert>
          )}
          {done === 'info-sent' && (
            <Alert type="info">Information request sent. The applicant will receive an email with your note.</Alert>
          )}

          <div className="grid lg:grid-cols-[1fr_300px] gap-5">

            {/* Main content */}
            <div className="flex flex-col gap-5">

              {/* Org summary */}
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="bg-[#1746A2] px-6 py-5">
                  <p className="display-font text-xl font-bold text-white">{APPLICATION.orgName}</p>
                  <p className="text-sm text-white/70 mt-0.5">{APPLICATION.orgType} · {APPLICATION.location}</p>
                </div>
                <div className="px-6 py-5 grid sm:grid-cols-3 gap-5">
                  {[
                    { label: 'Applicant', value: APPLICATION.applicantName },
                    { label: 'Contact', value: APPLICATION.applicantEmail },
                    { label: 'Phone', value: APPLICATION.applicantPhone },
                    { label: 'Est. members', value: `${APPLICATION.estimatedMembers}` },
                    { label: 'Frequency', value: APPLICATION.frequency },
                    { label: 'Avg. contribution', value: APPLICATION.avgContribution },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-[#9CA3AF] font-medium mb-0.5">{f.label}</p>
                      <p className="text-sm font-semibold text-[#0D1117]">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application narrative */}
              {[
                { heading: 'About the organization', text: APPLICATION.description },
                { heading: 'Current process', text: APPLICATION.existingProcess },
                { heading: 'Why digitize now?', text: APPLICATION.whyDigitize },
                { heading: 'Challenges', text: APPLICATION.challenges },
                { heading: 'Expected benefits', text: APPLICATION.expectedBenefits },
              ].map(s => (
                <div key={s.heading} className="bg-white rounded-xl border border-[#E2E6F0] px-6 py-5">
                  <p className="text-sm font-bold text-[#0D1117] mb-2">{s.heading}</p>
                  <p className="text-sm text-[#374151] leading-relaxed">{s.text}</p>
                </div>
              ))}

              {/* Info requested (if any) */}
              {APPLICATION.infoRequested && (
                <div className="bg-[#EFF6FF] rounded-xl border border-[#C7D2FE] px-6 py-5">
                  <p className="text-sm font-bold text-[#1746A2] mb-2">Information requested</p>
                  <p className="text-sm text-[#374151] leading-relaxed">{APPLICATION.infoRequested}</p>
                </div>
              )}

              {/* Review history */}
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                  <p className="text-sm font-bold text-[#0D1117]">Review history</p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  {APPLICATION.history.map((h, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1746A2] shrink-0 mt-1.5" />
                      <div>
                        <p className="font-semibold text-[#0D1117]">{h.action}</p>
                        <p className="text-xs text-[#9CA3AF]">{h.date} · {h.by}</p>
                        {h.note && <p className="text-xs text-[#6B7280] mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-5">

              {/* Eligibility check */}
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                  <p className="text-sm font-bold text-[#0D1117]">Eligibility checks</p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  {[
                    { label: 'Account verified', ok: check.accountVerified },
                    { label: 'Min. contribution history', ok: check.minContributionHistory },
                    { label: 'No active disputes', ok: check.noActiveDisputes },
                    { label: 'Referral verified', ok: check.referralVerified },
                    { label: 'Govt ID submitted', ok: check.govtIdSubmitted },
                  ].map(c => (
                    <div key={c.label} className="flex items-center justify-between gap-2">
                      <p className="text-sm text-[#374151]">{c.label}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.ok ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                        {c.ok ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {!done && (
                <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                    <p className="text-sm font-bold text-[#0D1117]">Review decision</p>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-3">
                    {/* Action selector */}
                    <div className="flex flex-col gap-2">
                      {[
                        { value: 'approve' as ReviewAction, label: 'Approve application', color: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]' },
                        { value: 'request-info' as ReviewAction, label: 'Request more information', color: 'border-[#C7D2FE] bg-[#EEF2FF] text-[#1746A2]' },
                        { value: 'reject' as ReviewAction, label: 'Reject application', color: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAction(a => a === opt.value ? null : opt.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${action === opt.value ? opt.color : 'border-[#E2E6F0] text-[#6B7280] hover:border-[#C7D2FE]'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Contextual input */}
                    {action === 'request-info' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#374151]">Information required *</label>
                        <textarea
                          value={infoNote}
                          onChange={e => setInfoNote(e.target.value)}
                          rows={3}
                          placeholder="Describe what information or documents you need from the applicant…"
                          className="w-full px-3 py-2.5 text-sm border border-[#E2E6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
                        />
                      </div>
                    )}
                    {action === 'reject' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#374151]">Rejection reason *</label>
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          rows={3}
                          placeholder="Provide a clear reason that will be shared with the applicant…"
                          className="w-full px-3 py-2.5 text-sm border border-[#E2E6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
                        />
                      </div>
                    )}
                    {action === 'approve' && (
                      <p className="text-xs text-[#6B7280] bg-[#F8FAFF] rounded-lg px-3 py-2">
                        Approving will activate the organization and notify the applicant. This action is logged in the approval audit trail.
                      </p>
                    )}

                    <Button
                      disabled={!action || (action === 'request-info' && !infoNote.trim()) || (action === 'reject' && !rejectReason.trim())}
                      onClick={submit}
                      variant={action === 'approve' ? 'success' : action === 'reject' ? 'danger' : 'primary'}
                      className="w-full"
                    >
                      {action === 'approve' ? 'Approve organization' : action === 'request-info' ? 'Send info request' : action === 'reject' ? 'Reject application' : 'Select an action'}
                    </Button>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('org-eligibility')}
                className="text-sm font-semibold text-[#1746A2] hover:underline text-left"
              >
                View eligibility history →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
