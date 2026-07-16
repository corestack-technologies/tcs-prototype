import { useState } from 'react'
import { Button, Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import { ORGANIZATION, OWNER_GROUPS } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

export function OwnerProfile({ navigate }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: ORGANIZATION.name, tagline: ORGANIZATION.tagline, description: ORGANIZATION.description, location: ORGANIZATION.location })

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => { setSaving(false); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000) }, 1200)
  }

  return (
    <OwnerShell navigate={navigate} activeView="owner-profile">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="display-font text-xl font-bold text-[#0D1117]">Organization profile</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Visible to members and applicants</p>
          </div>
          {!editing && <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit profile</Button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-2xl flex flex-col gap-6">

          {saved && <Alert type="success">Profile updated successfully.</Alert>}

          {/* Organization card */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            {/* Header banner */}
            <div className="h-20 bg-gradient-to-r from-[#1746A2] to-[#2563EB]" />
            <div className="px-6 pb-6 -mt-6">
              <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow flex items-center justify-center text-2xl font-bold text-[#1746A2] mb-3">
                {ORGANIZATION.name.slice(0, 2)}
              </div>

              {!editing ? (
                <div>
                  <h2 className="display-font text-xl font-bold text-[#0D1117]">{form.name}</h2>
                  <p className="text-sm text-[#6B7280] mt-0.5 italic">{form.tagline}</p>
                  <p className="text-sm text-[#374151] mt-3 leading-relaxed">{form.description}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {[
                      { icon: '📍', value: form.location },
                      { icon: '📅', value: `Founded ${ORGANIZATION.createdAt}` },
                      { icon: '👥', value: `${ORGANIZATION.memberCount} members` },
                      { icon: '🏛', value: `${ORGANIZATION.groupCount} active groups` },
                    ].map(b => (
                      <span key={b.value} className="text-xs text-[#6B7280] bg-[#F4F6FA] px-3 py-1.5 rounded-full">
                        {b.icon} {b.value}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={save} className="flex flex-col gap-4 mt-2">
                  {[
                    { label: 'Organization name', key: 'name' as const, placeholder: 'Organization name' },
                    { label: 'Tagline', key: 'tagline' as const, placeholder: 'A short phrase…' },
                    { label: 'Location', key: 'location' as const, placeholder: 'City, State' },
                  ].map(f => (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#0D1117]">{f.label}</label>
                      <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]" />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#0D1117]">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" loading={saving}>Save changes</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Owner information */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Organization owner</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1746A2] flex items-center justify-center text-base font-bold text-white shrink-0">
                {ORGANIZATION.owner.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0D1117]">{ORGANIZATION.owner.name}</p>
                <p className="text-xs text-[#6B7280]">{ORGANIZATION.owner.email}</p>
                <p className="text-xs text-[#6B7280]">{ORGANIZATION.owner.phone}</p>
              </div>
            </div>
          </div>

          {/* Org stats */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Organization statistics</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total members', value: `${ORGANIZATION.memberCount}` },
                { label: 'Active groups', value: `${ORGANIZATION.groupCount}` },
                { label: 'Cycles completed', value: `${ORGANIZATION.totalCyclesCompleted}` },
                { label: 'Total disbursed', value: `₦${(ORGANIZATION.totalDisbursed / 1000000).toFixed(1)}M` },
                { label: 'Founded', value: ORGANIZATION.createdAt },
                { label: 'Status', value: 'Active' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{s.label}</p>
                  <p className="text-sm font-bold text-[#0D1117] mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Groups summary */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Groups in this organization</p>
            <div className="flex flex-col gap-3">
              {OWNER_GROUPS.map(g => (
                <div key={g.id} className="flex items-center gap-3">
                  <span className="text-lg">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0D1117] truncate">{g.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{g.members} members · ₦{g.amount.toLocaleString()}/{g.frequency.toLowerCase()}</p>
                  </div>
                  <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">Active</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </OwnerShell>
  )
}
