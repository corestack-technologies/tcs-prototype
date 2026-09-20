import { useState } from "react"
import { Alert, Button, Field, Input, Select } from "../components/ui"
import { useClient } from "./ClientContext"
import {
  enquireAccountName,
  prototypeBanks,
  saveBankDetails,
  type NameEnquiryResult,
} from "./service"

export function BankDetailsEditor() {
  const { client, update } = useClient()
  const [bankCode, setBankCode] = useState(client?.bankDetails?.bankCode ?? "")
  const [accountNumber, setAccountNumber] = useState(
    client?.bankDetails?.accountNumber ?? "",
  )
  const [result, setResult] = useState<NameEnquiryResult | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  if (!client) return null
  const reset = () => {
    setResult(null)
    setConfirmed(false)
    setError("")
    setSaved(false)
  }
  return (
    <div className="space-y-5">
      <Alert type="info">
        Prototype Name Enquiry uses fixed sample results. No bank is contacted
        and no real account ownership is verified.
      </Alert>
      {client.bankDetails ? (
        <p className="text-sm leading-6">
          Saved: {client.bankDetails.bankName} ·{" "}
          {client.bankDetails.accountNumber} · {client.bankDetails.resolvedName}
          <br />
          Confirmed by Member (demo)
        </p>
      ) : client.profile.accountNumber ? (
        <p className="text-sm leading-6">
          Existing sample details: {client.profile.bankName} ·{" "}
          {client.profile.accountNumber} · {client.profile.accountName}. These
          have not been confirmed through Name Enquiry.
        </p>
      ) : (
        <p className="text-sm">No bank details saved yet.</p>
      )}
      <fieldset
        disabled={client.accountStatus === "closed"}
        className="space-y-5"
      >
        <Field label="Bank">
          <Select
            value={bankCode}
            onChange={(event) => {
              setBankCode(event.target.value)
              reset()
            }}
          >
            <option value="">Select bank</option>
            {prototypeBanks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Account number" hint="10 digits">
          <Input
            inputMode="numeric"
            maxLength={10}
            value={accountNumber}
            onChange={(event) => {
              setAccountNumber(
                event.target.value.replace(/\D/g, "").slice(0, 10),
              )
              reset()
            }}
          />
        </Field>
        <p className="text-sm leading-6 text-[var(--tcs-text-muted)]">
          Sample accounts for any listed bank: 0123456789 → ADEOLA JOHNSON;
          1234567890 → CHISOM OKAFOR. Use 0000000000 for no match or 9999999999
          for unavailable service.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            reset()
            try {
              setResult(enquireAccountName(bankCode, accountNumber))
            } catch (err) {
              setError((err as Error).message)
            }
          }}
        >
          Run Name Enquiry
        </Button>
        {result && (
          <div className="space-y-4 rounded-xl bg-[var(--tcs-surface-muted)] p-4">
            <p role="status" className="font-semibold">
              Resolved account name: {result.resolvedName}
            </p>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--tcs-brand)]"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              I confirm that this bank account and resolved name belong to me.
            </label>
            <Button
              type="button"
              disabled={!confirmed}
              onClick={() => {
                try {
                  update((value) => saveBankDetails(value, result, confirmed))
                  reset()
                  setSaved(true)
                } catch (err) {
                  setError((err as Error).message)
                }
              }}
            >
              Save bank details
            </Button>
          </div>
        )}
      </fieldset>
      {error && <Alert type="error">{error}</Alert>}
      {saved && (
        <p role="status" className="text-sm text-[var(--tcs-success-700)]">
          Bank details saved with your confirmation for this session.
        </p>
      )}
    </div>
  )
}
