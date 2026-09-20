import { useEffect, useRef, useState } from "react"
import { Alert, Button, Field, Input, Select, Textarea } from "../components/ui"
import { useClient } from "../clients/ClientContext"
import { useOrganization } from "./OrganizationContext"
import {
  enquireSettlement,
  requestSettlementChange,
  saveInitialSettlement,
  settlementBanks,
  type SettlementEnquiry,
} from "./service"
import type { SettlementAccount } from "./model"

export function SettlementAccountSummary({
  account,
}: {
  account: SettlementAccount
}) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      {[
        ["Bank", account.bankName],
        ["Account number", account.accountNumber],
        ["Resolved account name", account.resolvedName],
        ["Validation", "Name resolved · demo"],
        ["Owner confirmation", "Confirmed by Owner"],
        ["Confirmed at", new Date(account.confirmedAt).toLocaleString("en-NG")],
      ].map(([label, value]) => (
        <div key={label}>
          <dt className="text-[var(--tcs-text-muted)]">{label}</dt>
          <dd className="mt-1 break-words font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
export function SettlementAccountEditor() {
  const { client } = useClient()
  const { organization, updateOrganization } = useOrganization()
  const [editing, setEditing] = useState(false)
  const [bank, setBank] = useState("")
  const [number, setNumber] = useState("")
  const [result, setResult] = useState<SettlementEnquiry | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const request = useRef(0)
  useEffect(
    () => () => {
      request.current++
    },
    [],
  )
  if (!client || !organization) return null
  const current = organization.settlement
  const pending = organization.settlementChanges.find(
    (change) => ["pending","information-required"].includes(change.status) || (change.status === "approved" && !change.effectiveAt),
  )
  const canEdit = ["approved", "active", "restricted", "suspended"].includes(
    organization.status,
  )
  const invalidate = () => {
    request.current++
    setResult(null)
    setConfirmed(false)
    setError("")
    setNotice("")
    setLoading(false)
  }
  const enquiry = async () => {
    invalidate()
    setLoading(true)
    const version = request.current
    // A short local delay lets reviewers inspect the future API loading state.
    await new Promise((resolve) => setTimeout(resolve, 450))
    if (version !== request.current) return
    try {
      setResult(enquireSettlement(bank, number))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }
  const save = () => {
    if (!result) return
    try {
      updateOrganization((org) =>
        current
          ? requestSettlementChange(org, client, result, confirmed, reason)
          : saveInitialSettlement(org, client, result, confirmed),
      )
      invalidate()
      setEditing(false)
      setReason("")
      setBank("")
      setNumber("")
      setNotice(
        current
          ? "Change request submitted. Your current settlement account remains effective."
          : "Initial settlement account saved with your confirmation for this prototype session.",
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }
  return (
    <div className="space-y-5">
      {current ? (
        <div className="rounded-xl bg-[#f4f7fc] p-5">
          <h3 className="mb-4 text-sm font-semibold">
            Current settlement account
          </h3>
          <SettlementAccountSummary account={current} />
        </div>
      ) : (
        <p className="text-sm leading-6 text-[var(--tcs-text-muted)]">
          Set up the Organization’s first settlement account. This is separate
          from your personal Member payout account.
        </p>
      )}
      {pending && (
        <Alert type="warning" title="Settlement change awaiting TCS review">
          {pending.review?.state || "Awaiting review"}. {pending.review?.publicMessage} {pending.proposed.bankName} · {pending.proposed.accountNumber} ·{" "}
          {pending.proposed.resolvedName}. Your current account above remains
          effective until independent approval and the required provider update.
        </Alert>
      )}
      {organization.settlementChanges
        .filter((change) => change.status === "approved" && !!change.effectiveAt)
        .map((change) => (
          <Alert
            key={change.id}
            type="success"
            title="Approved change · effective in this demo"
          >
            Changed from {change.previous.bankName} · ending{" "}
            {change.previous.accountNumber.slice(-4)} to{" "}
            {change.proposed.bankName} · ending{" "}
            {change.proposed.accountNumber.slice(-4)}. Effective{" "}
            {change.effectiveAt &&
              new Date(change.effectiveAt).toLocaleString("en-NG")}
            . Independent approval and provider update are represented by this
            scenario.
          </Alert>
        ))}
      {current && !pending && canEdit && !editing && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            invalidate()
            setEditing(true)
          }}
        >
          Request settlement account change
        </Button>
      )}
      {canEdit && !pending && (!current || editing) && (
        <div className="space-y-5 rounded-xl border border-[var(--tcs-border)] p-5">
          <h3 className="font-semibold">
            {current
              ? "Validate the proposed replacement"
              : "Settlement account setup"}
          </h3>
          <Alert type="info">
            Prototype Name Enquiry uses fixed sample results. No real bank or
            payment provider is contacted.
          </Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank">
              <Select
                value={bank}
                onChange={(event) => {
                  setBank(event.target.value)
                  invalidate()
                }}
              >
                <option value="">Select bank</option>
                {settlementBanks.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Account number" hint="10 digits">
              <Input
                inputMode="numeric"
                maxLength={10}
                value={number}
                onChange={(event) => {
                  setNumber(event.target.value.replace(/\D/g, "").slice(0, 10))
                  invalidate()
                }}
              />
            </Field>
          </div>
          <details className="text-sm text-[var(--tcs-text-muted)]">
            <summary className="cursor-pointer font-medium">
              Sample accounts to try
            </summary>
            <ul className="mt-3 space-y-2">
              <li>0123456789 — OLAHBEE’S WORLD ENTERPRISES</li>
              <li>1234567890 — ADAEZE THRIFT NETWORK</li>
              <li>2222222222 — OLAHBEE WORLD SERVICES</li>
              <li>0000000000 — account not found</li>
              <li>9999999999 — enquiry unavailable</li>
            </ul>
            <p className="mt-3">
              These fixed results work with any listed bank.
            </p>
          </details>
          <Button
            type="button"
            variant="secondary"
            loading={loading}
            onClick={enquiry}
          >
            Name Enquiry
          </Button>
          {loading && (
            <p role="status" className="text-sm">
              Resolving account name…
            </p>
          )}
          {result && (
            <div className="space-y-4 rounded-xl bg-[#edf3ff] p-4">
              <p role="status" className="text-sm">
                Resolved account name{" "}
                <strong className="mt-1 block text-base">
                  {result.resolvedName}
                </strong>
              </p>
              <p className="text-xs text-[#536174]">
                Validation: demo-resolved ·{" "}
                {confirmed ? "Owner confirmed" : "Awaiting your confirmation"}
              </p>
              <label className="flex items-start gap-3 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={confirmed}
                  className="mt-1 h-4 w-4 accent-[#1746A2]"
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                I confirm this is the correct account for this Organization and
                I am authorized to use it for settlement.
              </label>
            </div>
          )}
          {current && (
            <Field label="Reason for change" required>
              <Textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={
                !result ||
                !confirmed ||
                loading ||
                (!!current && !reason.trim())
              }
              onClick={save}
            >
              {current ? "Submit change for review" : "Save settlement account"}
            </Button>
            {current && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  invalidate()
                  setEditing(false)
                }}
              >
                Cancel change
              </Button>
            )}
          </div>
        </div>
      )}
      {error && <Alert type="error">{error}</Alert>}
      {notice && (
        <p role="status" className="text-sm text-[#08714d]">
          {notice}
        </p>
      )}
      <p className="text-sm leading-6 text-[var(--tcs-text-muted)]">
        Settlement changes require validation, authorization, any required
        provider update and an audit record. The Owner cannot approve their own
        change request.
      </p>
    </div>
  )
}
