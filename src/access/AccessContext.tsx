import {changeSecurity,type SecurityAction} from './security'
import {previewAccessChange,applyAccessPreview,type AccessPreview} from './preview'
import { createContext, useContext, useState, useRef, type ReactNode } from "react"
import { seedAccess } from "./seeds"
import { changeAccess, type AccessAction } from "./service"
import type { InternalSession, AccessState } from "./model"
const Context = createContext<ReturnType<typeof useAccessState> | null>(null)
function useAccessState(
  initialState?: AccessState,
  initialUserId: string | null = null,
) {
  const [state] = useState(() => initialState || seedAccess()),
    [userId, select] = useState<string | null>(initialUserId),
    [version, refresh] = useState(0)
  const selectedId = useRef(userId)
  const session: InternalSession | null = userId
    ? { kind: "tcs-internal", personaId: userId, access: state }
    : null
  return {
    state,
    session,
    version,
    currentSession: (): InternalSession | null => selectedId.current ? {kind:"tcs-internal",personaId:selectedId.current,access:state} : null,
    select: (id: string | null) => {
      if (id && !state.users.some((u) => u.id === id))
        throw Error("Unknown internal user.")
      selectedId.current = id
      select(id)
    },
    preview:(action:AccessAction,reason:string)=>{if(!session)throw Error('Select an internal user.');return previewAccessChange(session,action,reason)},
    applyPreview:(preview:AccessPreview)=>{if(!session)throw Error('Select an internal user.');applyAccessPreview(session,preview);refresh(v=>v+1)},
    securityChange:(action:SecurityAction,reason:string,expected:string)=>{if(!session)throw Error('Select an internal user.');if(expected!==JSON.stringify(state))throw Error('Security state changed. Preview again.');changeSecurity(session,action,reason);refresh(v=>v+1)},
    change: (a: AccessAction, reason: string) => {
      if (!session) throw Error("Select an internal user.")
      changeAccess(session, a, reason)
      refresh((v) => v + 1)
    },
  }
}
export function AccessProvider({
  children,
  initialState,
  initialUserId,
}: {
  children: ReactNode
  initialState?: AccessState
  initialUserId?: string
}) {
  const value = useAccessState(initialState, initialUserId)
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useAccess() {
  const value = useContext(Context)
  if (!value) throw Error("AccessProvider is required")
  return value
}
