import { DisplayDate } from '../design/foundation'
﻿import { useState, type ReactNode } from "react"
import { useGroups, useDraftGroup } from "./GroupContext"
import { cycleOf, financiallyCommenced } from "./model"
import { OwnerShell } from "../components/org/OwnerShell"
import { Button, Alert } from "../components/ui"
import type { View, NavMeta } from "../App"
type Navigate = (view: View, meta?: NavMeta) => void
export function GroupGuard({
  navigate,
  children,
  allowLocked = false,
}: {
  navigate: Navigate
  children: ReactNode
  allowLocked?: boolean
}) {
  const { group, error } = useGroups()
  if (!group)
    return (
      <OwnerShell navigate={navigate} activeView="owner-groups">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">
            Choose a Group to continue
          </h1>
          <Button onClick={() => navigate("owner-groups")}>Open Groups</Button>
        </div>
      </OwnerShell>
    )
  if (allowLocked && cycleOf(group).status === "draft")
    return (
      <OwnerShell navigate={navigate} activeView="owner-groups">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">{group.name} · draft Cycle</h1>
          <p className="mb-4">This Cycle has not been activated. Complete preparation and review its readiness.</p>
          <Button onClick={() => navigate("owner-group-readiness")}>Review draft readiness</Button>
        </div>
      </OwnerShell>
    )
  if (!allowLocked && cycleOf(group).status !== "draft")
    return (
      <OwnerShell navigate={navigate} activeView="owner-groups">
        <div className="max-w-3xl p-8">
          <h1 className="text-2xl font-bold mb-4">
            {group.name} · Cycle {cycleOf(group).number}
          </h1>
          <p className="mb-4">
            This {cycleOf(group).status} Cycle is protected. Its participants,
            positions and terms remain on record.
          </p>
          <Button onClick={() => navigate("owner-group-activated")}>
            View Cycle record
          </Button>
        </div>
      </OwnerShell>
    )
  return (
    <>
      {error && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-300 rounded-xl p-4 shadow-lg max-w-xl"
        >
          {error}
        </div>
      )}
      {children}
    </>
  )
}
export function CycleCancellation() {
  const { cycle, act } = useDraftGroup()
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false)
  if (cycle.status === "cancelled")
    return (
      <Alert type="info">
        CANCELLED · <DisplayDate value={cycle.cancelledAt}/> · {cycle.cancellationReason}. The Group
        and Cycle history are retained.
      </Alert>
    )
  return (
    <section className="border border-[#E2E6F0] rounded-xl p-5 bg-white text-[#0D1117]">
      <h2 className="font-bold mb-2">Cancellation boundary</h2>
      <p className="text-sm mb-3">
        Normal cancellation is available only before any obligation, payment,
        financial allocation, payout or posting. Position assignment is not a
        financial allocation.
      </p>
      {financiallyCommenced(cycle) ? (
        <Alert type="warning">
          Financial participation has commenced. Normal cancellation is
          unavailable.
        </Alert>
      ) : (
        <>
          <Button variant="secondary" onClick={() => setOpen(!open)}>
            Cancel Cycle
          </Button>
          {open && (
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                Reason
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full border rounded-lg p-3 mt-1"
                />
              </label>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I confirm cancellation of this Cycle. Its history will remain.
              </label>
              <Button
                disabled={!confirmed || reason.trim().length < 5}
                onClick={() => act({ type: "cancel", reason, confirmed })}
              >
                Confirm cancellation
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
