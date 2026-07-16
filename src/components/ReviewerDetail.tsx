import { useState } from 'react'
import { Logo, Button, Badge, Alert, Textarea } from './ui'
import type { View, NavMeta } from '../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  clientId: string | null
}

type Decision = 'approve' | 'reject' | 'resubmit' | null

export function ReviewerDetail({ navigate, clientId }: Props) {
  const [decision, setDecision] = useState<Decision>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [resubmitNote, setResubmitNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [docExpanded, setDocExpanded] = useState<string | null>(null)

  const client = {
    id: clientId ?? '001',
    name: 'Adaeze Chidinma Okonkwo',
    email: 'adaeze@email.com',
    phone: '+234 801 234 5678',
    dob: '14 March 1991',
    age: 34,
    gender: 'Female',
    nin: '12345678901',
    address: '14B Bode Thomas Street, Surulere, Lagos State',
    bank: 'GTBank · 0123456789',
    accountName: 'ADAEZE CHIDINMA OKONKWO',
    submitted: '7 July 2025 at 09:32 AM',
  }

  const docs = [
    { id: 'nin-slip', label: 'NIN slip', type: 'image', size: '1.2 MB', note: 'NIMC NIN slip scan' },
    { id: 'proof', label: 'Proof of address', type: 'pdf', size: '840 KB', note: 'GTBank statement — June 2025' },
  ]

  const handleSubmit = () => {
    if (decision === 'reject' && !rejectionReason.trim()) return
    if (decision === 'resubmit' && !resubmitNote.trim()) return
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setSubmitted(true) }, 1600)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA] p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl
            bg-[#ECFDF5]">
            {decision === 'approve' ? '✅' : decision === 'reject' ? '❌' : '🔄'}
          </div>
          <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">Decision submitted</h1>
          <p className="text-[#6B7280] text-sm mb-6">
            {decision === 'approve' && "The client has been approved and notified. They can now join thrift groups."}
            {decision === 'reject' && "The client has been rejected. They've been notified with your reason."}
            {decision === 'resubmit' && "The client has been asked to resubmit their documents with your notes."}
          </p>
          <Button onClick={() => navigate('reviewer-queue')} size="lg">← Back to queue</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E6F0] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('reviewer-queue')}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium transition-colors"
          >
            ← Back to queue
          </button>
          <div className="w-px h-5 bg-[#E2E6F0]" />
          <Logo size="sm" />
        </div>
        <span className="text-xs bg-[#FEF3C7] text-[#92400E] px-2.5 py-1 rounded-full font-semibold">Internal reviewer</span>
      </div>

      <div className="flex-1 px-8 py-8 max-w-6xl mx-auto w-full">
        {/* Page title + status */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-1">Review: {client.name}</h1>
            <p className="text-sm text-[#6B7280]">Submitted {client.submitted}</p>
          </div>
          <Badge variant="pending">Pending review</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Client info */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Personal info */}
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1746A2] to-[#3B82F6] flex items-center justify-center text-white text-xl font-bold">
                  AO
                </div>
                <div>
                  <p className="display-font text-lg font-bold text-[#0D1117]">{client.name}</p>
                  <p className="text-sm text-[#6B7280]">{client.email} · {client.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 border-t border-[#F1F3F8] pt-5">
                {[
                  { label: 'Date of birth', value: client.dob },
                  { label: 'Age', value: `${client.age} years` },
                  { label: 'Gender', value: client.gender },
                  { label: 'NIN', value: client.nin },
                  { label: 'Address', value: client.address },
                  { label: 'Bank account', value: `${client.bank} · ${client.accountName}` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm text-[#0D1117] font-medium mt-0.5 leading-snug">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
              <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-4">Submitted documents</h2>
              <div className="flex flex-col gap-3">
                {docs.map(doc => (
                  <div key={doc.id} className="rounded-xl border border-[#E2E6F0] overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F8FAFF] transition-colors"
                      onClick={() => setDocExpanded(docExpanded === doc.id ? null : doc.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${doc.type === 'pdf' ? 'bg-[#FEE2E2]' : 'bg-[#DBEAFE]'}`}>
                          {doc.type === 'pdf' ? '📄' : '🖼'}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-[#0D1117]">{doc.label}</p>
                          <p className="text-xs text-[#9CA3AF]">{doc.note} · {doc.size}</p>
                        </div>
                      </div>
                      <svg className={`w-4 h-4 text-[#9CA3AF] transition-transform ${docExpanded === doc.id ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" />
                      </svg>
                    </button>
                    {docExpanded === doc.id && (
                      <div className="border-t border-[#F1F3F8] bg-[#F8FAFF] px-4 py-4">
                        <div className={`w-full rounded-xl flex items-center justify-center text-4xl ${doc.type === 'pdf' ? 'bg-[#FEE2E2]' : 'bg-[#DBEAFE]'}`} style={{ height: 200 }}>
                          {doc.type === 'pdf' ? '📄' : '🪪'}
                          <div className="ml-3 text-left">
                            <p className="text-base font-semibold text-[#374151]">{doc.label}</p>
                            <p className="text-xs text-[#9CA3AF]">[Document preview — {doc.size}]</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="secondary" size="sm">Download</Button>
                          <Button variant="ghost" size="sm">Open in new tab</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
              <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-4">Verification checklist</h2>
              <div className="flex flex-col gap-3">
                {[
                  { item: 'NIN matches submitted documents', status: 'pass' },
                  { item: 'Name on NIN matches account name', status: 'pass' },
                  { item: 'Address on proof document matches profile', status: 'pass' },
                  { item: 'Document is within 3 months', status: 'pass' },
                  { item: 'All images are clear and readable', status: 'warn' },
                  { item: 'Client is 18+ years old', status: 'pass' },
                ].map(({ item, status }) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${status === 'pass' ? 'bg-[#ECFDF5]' : 'bg-[#FFFBEB]'}`}>
                      {status === 'pass' ? (
                        <svg className="w-3 h-3 text-[#059669]" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      ) : (
                        <span className="text-[10px] text-[#D97706] font-bold">!</span>
                      )}
                    </div>
                    <span className={`text-sm ${status === 'pass' ? 'text-[#374151]' : 'text-[#92400E] font-medium'}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Decision panel */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-6 sticky top-6">
              <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-4">Make a decision</h2>

              {/* Decision buttons */}
              <div className="flex flex-col gap-2.5 mb-5">
                {[
                  { id: 'approve', label: '✅ Approve', desc: 'Client is verified and eligible', style: decision === 'approve' ? 'border-[#059669] bg-[#ECFDF5]' : 'border-[#E2E6F0] hover:border-[#A7F3D0]' },
                  { id: 'resubmit', label: '🔄 Request resubmission', desc: 'Ask client to upload clearer docs', style: decision === 'resubmit' ? 'border-[#D97706] bg-[#FFFBEB]' : 'border-[#E2E6F0] hover:border-[#FDE68A]' },
                  { id: 'reject', label: '❌ Reject', desc: 'Documents invalid or fraudulent', style: decision === 'reject' ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E2E6F0] hover:border-[#FECACA]' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDecision(opt.id as Decision)}
                    className={`text-left w-full rounded-xl border-2 px-4 py-3 transition-all ${opt.style}`}
                  >
                    <p className="text-sm font-semibold text-[#0D1117]">{opt.label}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Contextual note field */}
              {decision === 'reject' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#0D1117] mb-1.5">
                    Rejection reason <span className="text-[#DC2626]">*</span>
                  </label>
                  <Textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Explain why the submission is being rejected. This message will be sent to the client."
                    error={decision === 'reject' && !rejectionReason.trim()}
                  />
                  {decision === 'reject' && !rejectionReason.trim() && (
                    <p className="text-xs text-red-500 mt-1">A reason is required when rejecting.</p>
                  )}
                </div>
              )}

              {decision === 'resubmit' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#0D1117] mb-1.5">
                    Instructions for client <span className="text-[#DC2626]">*</span>
                  </label>
                  <Textarea
                    rows={3}
                    value={resubmitNote}
                    onChange={e => setResubmitNote(e.target.value)}
                    placeholder="Tell the client exactly what needs to be fixed or resubmitted."
                    error={decision === 'resubmit' && !resubmitNote.trim()}
                  />
                </div>
              )}

              {decision && (
                <Alert type={decision === 'approve' ? 'success' : decision === 'reject' ? 'error' : 'warning'} className="mb-4 text-xs">
                  {decision === 'approve' && 'The client will receive an email and SMS confirming they are now eligible for thrift participation.'}
                  {decision === 'reject' && 'The client will be notified with your reason. Their account will remain inactive.'}
                  {decision === 'resubmit' && 'The client will receive your instructions and be asked to resubmit their documents.'}
                </Alert>
              )}

              <Button
                className="w-full"
                size="lg"
                variant={decision === 'approve' ? 'success' : decision === 'reject' ? 'danger' : 'primary'}
                disabled={!decision}
                loading={submitting}
                onClick={handleSubmit}
              >
                {!decision ? 'Select a decision above' : decision === 'approve' ? 'Confirm approval' : decision === 'reject' ? 'Confirm rejection' : 'Send resubmission request'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
