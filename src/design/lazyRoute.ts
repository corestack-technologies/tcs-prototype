import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
/** SSR resolves real workspaces for authorization renders; clients load chunks on entry. */
export async function lazyRoute<T extends ComponentType<any>>(load:()=>Promise<{default:T}>):Promise<T|LazyExoticComponent<T>> {
 return import.meta.env.SSR ? (await load()).default : lazy(load)
}
