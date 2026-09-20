import { useState } from "react"
import { Alert, Button, Field, Input, Select, Textarea } from "../ui"
import { OwnerShell } from "./OwnerShell"
import { useClient } from "../../clients/ClientContext"
import { MemberAvatar } from "../../clients/MemberAvatar"
import { fullName } from "../../clients/model"
import { useOrganization } from "../../organizations/OrganizationContext"
import {
  OrganizationBrand,
  OrganizationLogoEditor,
} from "../../organizations/OrganizationBrand"
import {
  OrganizationSection,
  OrganizationStatusChip,
} from "../../organizations/OrganizationUI"
import { SettlementAccountEditor } from "../../organizations/SettlementAccountEditor"
import { editOrganizationProfile } from "../../organizations/service"
import {
  organizationFormErrors,
  type OrganizationForm,
} from "../../organizations/model"
import type { ClientPageProps } from "../../clients/ClientShell"

export function OwnerProfile({ navigate }: ClientPageProps) {
  const { client } = useClient()
  const { organization, updateOrganization } = useOrganization()
  const [draft, setDraft] = useState<OrganizationForm | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  if (!client || !organization)
    return (
      <OwnerShell navigate={navigate} activeView="owner-profile">
        No Organization selected.
      </OwnerShell>
    )
  const form = draft ?? organization.form
  const editable = ["approved", "active", "restricted", "suspended"].includes(
    organization.status,
  )
  const set = (key: keyof OrganizationForm, value: string) => {
    setDraft((previous) => ({
      ...(previous ?? organization.form),
      [key]: value,
    }))
    setSaved(false)
  }
  const save = (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    try {
      const {
        name,
        tagline,
        description,
        email,
        phone,
        address,
        location,
        accent,
      } = form
      updateOrganization((org) =>
        editOrganizationProfile(org, client, {
          name,
          tagline,
          description,
          email,
          phone,
          address,
          location,
          accent,
        }),
      )
      setDraft(null)
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }
  const errors = organizationFormErrors(form)
  return (
    <OwnerShell navigate={navigate} activeView="owner-profile">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#6b7280]">
            Your business, on TCS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Organization profile
          </h1>
        </div>
        {editable && !draft && (
          <Button
            variant="secondary"
            onClick={() => {
              setDraft({ ...organization.form })
              setSaved(false)
            }}
          >
            Edit business profile
          </Button>
        )}
      </div>
      <div className="mb-7 overflow-hidden rounded-3xl bg-white shadow-[var(--tcs-shadow-sm)]">
        <div
          className={`h-16 ${
            organization.form.accent === "navy"
              ? "bg-[#16345b]"
              : "bg-[#1746A2]"
          }`}
        />
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <OrganizationBrand form={organization.form} large />
          <OrganizationStatusChip organization={organization} />
        </div>
        <p className="px-6 pb-7 text-sm text-[#6b7280] sm:px-8">
          {organization.form.tagline}
        </p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <OrganizationSection
            title="Business identity & contact"
            description="The business information Members see alongside your Organization brand."
          >
            {draft ? (
              <form onSubmit={save} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {([
                    { key: "name", label: "Display / trading name" },
                    { key: "email", label: "Business email", type: "email" },
                    { key: "phone", label: "Business phone", type: "tel" },
                    { key: "location", label: "Operating location" },
                    { key: "address", label: "Business address" },
                    { key: "tagline", label: "Tagline" },
                  ] as const).map((item) => (
                    <Field
                      key={item.key}
                      label={item.label}
                      error={errors[item.key]}
                    >
                      <Input
                        type={"type" in item ? item.type : "text"}
                        value={form[item.key]}
                        onChange={(event) => set(item.key, event.target.value)}
                      />
                    </Field>
                  ))}
                </div>
                <Field label="Business description" error={errors.description}>
                  <Textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) => set("description", event.target.value)}
                  />
                </Field>
                <Field label="Organization accent">
                  <Select
                    value={form.accent}
                    onChange={(event) => set("accent", event.target.value)}
                  >
                    <option value="blue">TCS blue</option>
                    <option value="navy">Deep navy</option>
                  </Select>
                </Field>
                {error && <Alert type="error">{error}</Alert>}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit">Save business profile</Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setDraft(null)
                      setError("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="grid gap-5 text-sm sm:grid-cols-2">
                {[
                  [
                    "Legal / business name",
                    organization.form.legalName || organization.application.snapshot?.name || organization.form.name,
                  ],
                  ["Business type", organization.form.orgType],
                  [
                    "Registration reference",
                    organization.form.registration || "Not supplied",
                  ],
                  ["Business email", organization.form.email],
                  ["Business phone", organization.form.phone],
                  [
                    "Address",
                    `${organization.form.address}, ${organization.form.location}`,
                  ],
                  ["Description", organization.form.description],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[#6b7280]">{label}</dt>
                    <dd className="mt-1 break-words font-medium leading-6">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {saved && (
              <p role="status" className="mt-4 text-sm text-[#08714d]">
                Business profile saved across this Organization workspace.
              </p>
            )}
            <p className="mt-5 text-sm leading-6 text-[#6b7280]">
              The submitted legal identity and business reference remain in your
              application record. Changes to those records require TCS review.
            </p>
          </OrganizationSection>
          <OrganizationSection
            title="Settlement account"
            description="Organization settlement details and controlled account changes."
          >
            <SettlementAccountEditor />
          </OrganizationSection>
        </div>
        <div className="space-y-6">
          <OrganizationSection
            title="Organization logo"
            description="Your business logo is separate from your personal Member avatar."
          >
            <OrganizationLogoEditor
              form={organization.form}
              disabled={!editable}
              onChange={(patch) =>
                updateOrganization((org) =>
                  editOrganizationProfile(org, client, patch),
                )
              }
            />
          </OrganizationSection>
          <OrganizationSection title="Organization Owner">
            <div className="flex items-center gap-4">
              <MemberAvatar client={client} />
              <div className="min-w-0">
                <p className="font-semibold">{fullName(client)}</p>
                <p className="mt-1 break-all text-sm text-[#6b7280]">
                  {client.profile.email}
                </p>
              </div>
            </div>
            <Button
              className="mt-5"
              variant="secondary"
              onClick={() => navigate("client-profile")}
            >
              View personal Member profile
            </Button>
            <p className="mt-4 text-sm leading-6 text-[#6b7280]">
              One Owner, linked to Member {client.id}. You may participate in
              your own Groups as a normal Member. Exceptions that benefit you
              require independent TCS review.
            </p>
          </OrganizationSection>
          <OrganizationSection
            title="Brand preview"
            description="A reusable identity for future Group pages and invitations."
          >
            <div className="rounded-2xl bg-[#f4f7fc] p-5">
              <OrganizationBrand form={form} />
              <div className="mt-5 border-t border-[#dce4ef] pt-4">
                <p className="text-sm font-semibold">
                  Your community’s monthly contribution Group
                </p>
                <p className="mt-2 text-xs leading-5 text-[#6b7280]">
                  Illustrative preview · Group setup follows in Thrift.
                </p>
              </div>
            </div>
          </OrganizationSection>
        </div>
      </div>
    </OwnerShell>
  )
}
