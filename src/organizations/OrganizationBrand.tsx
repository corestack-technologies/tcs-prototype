import { useEffect, useId, useState } from "react"
import { Alert, Button } from "../components/ui"
import type { OrganizationForm } from "./model"
import { validateOrganizationFile } from "./service"

export function OrganizationLogo({
  form,
  large = false,
}: {
  form: OrganizationForm
  large?: boolean
}) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    if (!form.logo) {
      setUrl("")
      return
    }
    const next = URL.createObjectURL(form.logo)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [form.logo])
  const size = large ? "h-24 w-24 rounded-3xl" : "h-12 w-12 rounded-2xl"
  return (
    <span
      className={`${size} inline-flex shrink-0 items-center justify-center overflow-hidden ${
        form.accent === "navy" ? "bg-[#16345b]" : "bg-[#1746A2]"
      } text-white`}
    >
      {url ? (
        <img
          className="h-full w-full object-contain p-1"
          src={url}
          alt={`${form.name} logo`}
        />
      ) : form.logoStyle === "initials" ? (
        <span
          className={
            large ? "text-3xl font-semibold" : "text-base font-semibold"
          }
          aria-label={`${form.name || "Organization"} logo fallback`}
        >
          {form.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase() || "O"}
        </span>
      ) : (
        <svg
          role="img"
          aria-label={`${form.name} sample logo`}
          viewBox="0 0 64 64"
          className="h-4/5 w-4/5"
          fill="none"
        >
          <circle
            cx="32"
            cy="32"
            r="22"
            stroke="currentColor"
            strokeWidth="2"
            opacity=".4"
          />
          {form.logoStyle === "arch" ? (
            <>
              <path
                d="M19 43V29a13 13 0 0126 0v14M25 43V29a7 7 0 0114 0v14"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path d="M15 46h34" stroke="currentColor" strokeWidth="3" />
            </>
          ) : (
            <>
              <circle
                cx="25"
                cy="32"
                r="12"
                stroke="currentColor"
                strokeWidth="3"
              />
              <circle
                cx="39"
                cy="32"
                r="12"
                stroke="currentColor"
                strokeWidth="3"
              />
            </>
          )}
        </svg>
      )}
    </span>
  )
}
// A compact co-brand that future Group and invitation screens can consume.
export function OrganizationBrand({
  form,
  large = false,
}: {
  form: OrganizationForm
  large?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <OrganizationLogo form={form} large={large} />
      <div className="min-w-0">
        <p
          className={`${
            large ? "text-2xl sm:text-3xl" : "text-base"
          } break-words font-semibold leading-tight`}
        >
          {form.name || "Your Organization"}
        </p>
        <p className="mt-2 text-xs font-medium tracking-wide opacity-70">
          Powered by TCS
        </p>
      </div>
    </div>
  )
}
export function OrganizationLogoEditor({
  form,
  onChange,
  disabled = false,
}: {
  form: OrganizationForm
  onChange: (patch: Partial<OrganizationForm>) => void
  disabled?: boolean
}) {
  const id = useId()
  const [error, setError] = useState("")
  const [reading, setReading] = useState(false)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5">
        <OrganizationLogo form={form} large />
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="block text-sm font-semibold">
            {form.logo
              ? "Replace Organization logo"
              : "Upload Organization logo"}
          </label>
          <p
            id={`${id}-help`}
            className="my-2 text-sm text-[var(--tcs-text-muted)]"
          >
            PNG or JPG, up to 2 MB. Kept in this session.
          </p>
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg"
            aria-describedby={`${id}-help`}
            disabled={disabled || reading}
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf3ff] file:px-3 file:py-2 file:text-[#1746A2]"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (!file) return
              setError("")
              setReading(true)
              try {
                validateOrganizationFile(file, true)
                const bitmap = await createImageBitmap(file)
                bitmap.close()
                onChange({ logo: file })
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Choose a readable image.",
                )
              } finally {
                setReading(false)
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["arch", "circle"] as const).map((style) => (
          <Button
            key={style}
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || reading}
            onClick={() => onChange({ logo: null, logoStyle: style })}
          >
            Use {style} sample logo
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || reading}
          onClick={() => onChange({ logo: null, logoStyle: "initials" })}
        >
          Remove logo
        </Button>
      </div>
      {reading && (
        <p role="status" className="text-sm">
          Reading logo…
        </p>
      )}
      {error && <Alert type="error">{error}</Alert>}
    </div>
  )
}
