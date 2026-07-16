import { useState } from 'react'
import { Button, Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import { ORGANIZATION } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

export function OwnerSettings({ navigate }: Props) {
  const [notifications, setNotifications] = useState({ joinRequests: true, contributions: true, payouts: true, system: false })
  const [membership, setMembership] = useState({ requireReferral: false, showPayoutQueue: true, showMemberList: true })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleNotif = (key: keyof typeof notifications) => setNotifications(n => ({ ...n, [key]: !n[key] }))

  const save = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000) }, 1000)
  }

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${value ? 'bg-[#1746A2]' : 'bg-[#E2E6F0]'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  )

  return (
    <OwnerShell navigate={navigate} activeView="owner-settings">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <h1 className="display-font text-xl font-bold text-[#0D1117]">Organization settings</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Manage preferences for {ORGANIZATION.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-xl flex flex-col gap-6">

          {saved && <Alert type="success">Settings saved.</Alert>}

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F3F8]">
              <p className="text-sm font-bold text-[#0D1117]">Email notifications</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Sent to {ORGANIZATION.owner.email}</p>
            </div>
            <div className="divide-y divide-[#F1F3F8]">
              {[
                { key: 'joinRequests' as const, label: 'New join requests', desc: 'When a member requests to join one of your groups' },
                { key: 'contributions' as const, label: 'Payment references submitted', desc: 'When a member submits a reference for verification' },
                { key: 'payouts' as const, label: 'Payout reminders', desc: 'When a payout is ready to be recorded and sent' },
                { key: 'system' as const, label: 'System announcements', desc: 'TCS platform updates and announcements' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0D1117]">{item.label}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle value={notifications[item.key]} onToggle={() => toggleNotif(item.key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Membership settings */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F3F8]">
              <p className="text-sm font-bold text-[#0D1117]">Membership</p>
            </div>
            <div className="divide-y divide-[#F1F3F8]">
              {([
                { key: 'requireReferral' as const, label: 'Require referral for join requests', desc: 'Only members referred by an existing member can apply' },
                { key: 'showPayoutQueue' as const, label: 'Allow members to view payout queue', desc: 'Members can see the full payout order for their group' },
                { key: 'showMemberList' as const, label: 'Show member list to all members', desc: 'Members can see other members in the same group' },
              ] as const).map(item => (
                <div key={item.key} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0D1117]">{item.label}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle value={membership[item.key]} onToggle={() => setMembership(m => ({ ...m, [item.key]: !m[item.key] }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F3F8]">
              <p className="text-sm font-bold text-[#0D1117]">Account</p>
            </div>
            <div className="divide-y divide-[#F1F3F8]">
              <div className="flex items-center justify-between px-5 py-4 gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0D1117]">Organization ID</p>
                  <p className="text-xs font-mono text-[#9CA3AF]">TCS-ORG-2025-00847</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-4 gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0D1117]">Organization status</p>
                  <p className="text-xs text-[#059669] font-semibold">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F3F8]">
              <p className="text-sm font-bold text-[#0D1117]">Team members</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Delegate operational tasks to coordinators and treasurers</p>
            </div>
            <div className="px-5 py-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F1F3F8] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 110 6 3 3 0 010-6zm-5 9a1 1 0 011-1h8a1 1 0 011 1v1a4 4 0 01-10 0v-1z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#6B7280]">Coming soon</p>
                <p className="text-xs text-[#9CA3AF]">Role delegation for coordinators and treasurers will be available in a future update.</p>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-xl border border-[#FECACA] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#FECACA] bg-[#FEF2F2]">
              <p className="text-sm font-bold text-[#991B1B]">Organization actions</p>
              <p className="text-xs text-[#991B1B]/70 mt-0.5">These actions affect all groups and members in your organization.</p>
            </div>
            <div className="divide-y divide-[#FEE2E2]">
              <div className="px-5 py-4">
                <p className="text-sm text-[#374151] mb-1 font-semibold">Pause new activities</p>
                <p className="text-xs text-[#9CA3AF] mb-3">Stops new join requests, group creation, and cycle starts. Existing active cycles continue until completion.</p>
                <button className="text-sm font-semibold text-[#D97706] border border-[#FDE68A] bg-white px-4 py-2 rounded-lg hover:bg-[#FFFBEB] transition-colors">
                  Pause new activities
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-[#374151] mb-1 font-semibold">Request organization closure</p>
                <p className="text-xs text-[#9CA3AF] mb-3">Submit a formal request to close your organization once all active cycles are complete. TCS will review and confirm the closure.</p>
                <button className="text-sm font-semibold text-[#DC2626] border border-[#FECACA] bg-white px-4 py-2 rounded-lg hover:bg-[#FEF2F2] transition-colors">
                  Request closure
                </button>
              </div>
              <div className="px-5 py-3 bg-[#FEF2F2]/50">
                <p className="text-xs text-[#9CA3AF]">Administrative suspension of an organization is an internal TCS action and cannot be requested here.</p>
              </div>
            </div>
          </div>

          <Button loading={saving} onClick={save} className="w-full">Save settings</Button>
        </div>
      </div>
    </OwnerShell>
  )
}
