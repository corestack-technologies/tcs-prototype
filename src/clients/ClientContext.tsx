import { requireBusinessReportAccess } from '../reports/permissions'
import { requireInternal, type InternalSession } from '../operations/model'
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  createClient,
  emptyProfile,
  type Client,
  type Profile,
} from "./model"

import { demoPersonas, seedPersona, type PersonaId } from './seeds'

interface ClientContextValue {
  reportingClients: (actor: InternalSession | null) => Client[]
  authenticatedMember: () => Client | null
  eligibleForCommitment: (id:string)=>boolean
  syncRecoveryEligibility: (records:import("../operations/interventionModel").RestrictionRecord[])=>void
  replaceOperationsClients: (actor: InternalSession | null, expected: Client[], next: Client[]) => void
  operationsClients: (session: InternalSession | null) => Client[]
  payoutBank:(memberId:string)=>import("./model").MemberBankDetails|undefined
  client: Client | null
  register: (profile: Partial<Profile>, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<Client>
  logout: () => void
  openPersona: (id: PersonaId) => void
  update: (transform: (client: Client) => Client) => void
}
const ClientContext = createContext<ClientContextValue | null>(null)
async function fingerprint(password: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  )
  return Array.from(new Uint8Array(bytes), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("")
}
export function ClientProvider({ children }: { children: ReactNode }) {
  // Deliberately memory-only: passwords, NIN and documents are never persisted to browser storage.
  const [accounts] = useState(() =>
    new Map<string, { client: Client; credential: string }>(demoPersonas.map(persona => [persona.email, { client: seedPersona(persona.id), credential: '' }])),
  )
  const [client, setClient] = useState<Client | null>(null)
  const current = useRef<Client | null>(null)
  const select = (next: Client | null) => {
    current.current = next
    setClient(next)
  }
  const update = (transform: (value: Client) => Client) => {
    if (!current.current) throw new Error("Sign in to continue.")
    const next = transform(current.current)
    const entry = accounts.get(next.profile.email.toLowerCase())
    if (entry && entry.client.id === next.id)
      accounts.set(next.profile.email.toLowerCase(), {
        ...entry,
        client: next,
      })
    select(next)
  }
  const register = async (profile: Partial<Profile>, password: string) => {
    const email = profile.email?.trim().toLowerCase() || ""
    if (accounts.has(email))
      throw new Error(
        "This email already has an account in this session. Sign in instead.",
      )
    const credential = await fingerprint(password)
    const next = createClient({ ...emptyProfile, ...profile, email })
    accounts.set(email, { client: next, credential })
    select(next)
  }
  const login = async (email: string, password: string) => {
    const entry = accounts.get(email.trim().toLowerCase())
    if (!entry || !password || (!entry.client.example && entry.credential !== (await fingerprint(password))))
      throw new Error(
        "Email or password does not match an account created in this prototype session.",
      )
    select(entry.client)
    return entry.client
  }
  return (
    <ClientContext.Provider
      value={{
        reportingClients: actor => { requireBusinessReportAccess(actor); return [...accounts.values()].map(e => e.client) },
        replaceOperationsClients: (actor, expected, next) => {
          requireInternal(actor)
          for(const value of next){const entry=[...accounts.values()].find(a=>a.client.id===value.id),before=expected.find(c=>c.id===value.id);if(!entry||!before||JSON.stringify(entry.client)!==JSON.stringify(before)||value.profile.email!==before.profile.email)throw Error('Client changed; preview again.')}
          for(const value of next){const entry=accounts.get(value.profile.email.toLowerCase())!;accounts.set(value.profile.email.toLowerCase(),{...entry,client:value});if(current.current?.id===value.id)select(value)}
        },
        operationsClients: session => { requireInternal(session); return [...accounts.values()].map(a=>a.client) },
        payoutBank:memberId=>{const value=[...accounts.values()].find(a=>a.client.id===memberId)?.client.bankDetails;return value?structuredClone(value):undefined},
        eligibleForCommitment: id=>{const m=[...accounts.values()].find(a=>a.client.id===id)?.client;return !m||m.accountStatus==='active'&&!m.restrictions?.some(r=>r.reviewStatus==='active')},
        syncRecoveryEligibility: records=>{
          for(const entry of accounts.values()){
            const incoming=records.filter(r=>r.targetId===entry.client.id)
            if(!incoming.length)continue
            const retained=(entry.client.restrictions||[]).filter(r=>r.type!=='post-payout-default'||!incoming.some(i=>i.id===r.id))
            const restrictions=[...retained.map(r=>{
              const resolved=incoming.find(i=>i.sourceCaseId===r.sourceCaseId&&i.reviewStatus==='released')
              return resolved&&r.reviewStatus==='active'?{...r,reviewStatus:'released' as const,releasedAt:resolved.releasedAt,releasedBy:resolved.releasedBy,removalReason:resolved.removalReason}:r
            }),...incoming]
            if(JSON.stringify(entry.client.restrictions)!==JSON.stringify(restrictions)){
              entry.client={...entry.client,restrictions:structuredClone(restrictions)}
              if(current.current?.id===entry.client.id)select(entry.client)
            }
          }
        },
        authenticatedMember: () => current.current,
        client,
        update,
        register,
        login,
        logout: () => select(null),
        openPersona: id => {
          const persona = demoPersonas.find(item => item.id === id)!
          select(accounts.get(persona.email)!.client)
        },
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}
export function useClient() {
  const context = useContext(ClientContext)
  if (!context) throw new Error("ClientProvider is required")
  return context
}
