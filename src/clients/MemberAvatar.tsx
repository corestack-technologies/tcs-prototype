import { useEffect, useId, useState } from "react"
import { useClient } from "./ClientContext"
import { fullName, type Client } from "./model"
import { setProfileImage } from "./service"
import { Alert, Button } from "../components/ui"

export function MemberAvatar({
  client,
  large = false,
}: {
  client: Client
  large?: boolean
}) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    if (!client.profileImage) {
      setUrl("")
      return
    }
    const next = URL.createObjectURL(client.profileImage)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [client.profileImage])
  const size = large ? "h-24 w-24 text-2xl" : "h-10 w-10 text-sm"
  return url ? (
    <img
      src={url}
      alt={`${fullName(client)} profile picture`}
      className={`${size} shrink-0 rounded-2xl object-cover`}
    />
  ) : (
    <span
      aria-label={`${fullName(client)} initials`}
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-2xl bg-[var(--tcs-brand-900)] font-semibold text-white`}
    >
      {[client.profile.firstName, client.profile.lastName]
        .map((name) => name[0])
        .join("")}
    </span>
  )
}
export function AvatarEditor() {
  const { client, update } = useClient()
  const id = useId()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  if (!client) return null
  return (
    <div className="flex flex-wrap items-center gap-6">
      <MemberAvatar client={client} large />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-semibold">
          {client.profileImage
            ? "Replace profile image"
            : "Choose profile image"}
        </label>
        <p
          id={`${id}-help`}
          className="mb-3 mt-2 text-sm text-[var(--tcs-text-muted)]"
        >
          JPG or PNG, up to 5 MB. Saved in this prototype session.
        </p>
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png"
          aria-describedby={`${id}-help`}
          disabled={loading || client.accountStatus === "closed"}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--tcs-brand-soft)] file:px-3 file:py-2 file:text-[var(--tcs-brand)]"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (!file) return
            setError("")
            setLoading(true)
            try {
              setProfileImage(client, file)
              const bitmap = await createImageBitmap(file)
              bitmap.close()
              update((value) =>
                value.id === client.id ? setProfileImage(value, file) : value,
              )
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Please choose a readable image.",
              )
            } finally {
              setLoading(false)
            }
          }}
        />
        {loading && (
          <p role="status" className="mt-2 text-sm">
            Reading image…
          </p>
        )}
        {client.profileImage && (
          <Button
            type="button"
            variant="ghost"
            disabled={loading || client.accountStatus === "closed"}
            className="mt-3"
            onClick={() => update((value) => setProfileImage(value, null))}
          >
            Remove picture
          </Button>
        )}
        {error && (
          <Alert type="error" className="mt-3">
            {error}
          </Alert>
        )}
      </div>
    </div>
  )
}
