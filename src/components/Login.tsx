import { useState } from 'react'
import { Button, Field, Input, Alert } from './ui'
import type { View, NavMeta } from '../App'
import { useClient } from '../clients/ClientContext'
import { contactComplete } from '../clients/model'
import { demoPersonas, type PersonaId } from '../clients/seeds'
import { Dialog } from '../design/foundation'
import { AuthLayout } from '../auth/AuthLayout'
interface LoginProps { navigate: (v: View, meta?: NavMeta) => void }
export function DemoAccounts({ onSelect, onOrganization, onInternal }: {
  onSelect: (id: PersonaId) => void
  onOrganization: () => void
  onInternal: (view: View) => void
}) {
  return <div className="space-y-6">
    <p className="text-sm text-[var(--tcs-text-muted)]">Choose a prototype experience. Changes stay in this session when you switch accounts. Reloading clears the session. Demo Member emails also accept any password.</p>
    <section aria-labelledby="demo-members">
      <h3 id="demo-members" className="mb-3 font-semibold">Member demos</h3>
      <div className="space-y-4">{[
        { name: 'Onboarding', ids: ['new', 'incomplete'] },
        { name: 'Verification', ids: ['required', 'pending', 'information-required', 'rejected'] },
        { name: 'Existing Member', ids: ['verified', 'restricted', 'suspended'] },
      ].map(group => <section key={group.name}>
        <h4 className="mb-2 text-sm font-semibold text-[var(--tcs-text-muted)]">{group.name}</h4>
        <div className="grid gap-2 sm:grid-cols-2">{demoPersonas.filter(p => group.ids.includes(p.id)).map(p =>
          <button type="button" className="auth-demo-option" key={p.id} onClick={() => onSelect(p.id)}>
            <span className="text-sm font-semibold">{p.label}</span><small>{p.description}</small><small>{p.email}</small>
          </button>
        )}</div>
      </section>)}</div>
    </section>
    <details className="border-t border-[var(--tcs-border)] pt-3">
      <summary className="font-semibold">Organization demos</summary>
      <button type="button" className="auth-demo-option mt-3" onClick={onOrganization}>
        <span className="text-sm font-semibold">Organization</span>
        <small>Open Organization entry as the Verified Member. Existing scenarios remain available there.</small>
      </button>
    </details>
    <details className="border-t border-[var(--tcs-border)] pt-3">
      <summary className="font-semibold">TCS Internal demos</summary>
      <p className="my-3 text-sm text-[var(--tcs-text-muted)]">Choose a workspace, then use its existing internal demo-user selector. Access follows the selected user's permissions.</p>
      <div className="grid gap-2 sm:grid-cols-2">{([
        { label: 'Operations', view: 'operations' },
        { label: 'Access Management', view: 'access-management' },
        { label: 'Verification review', view: 'reviewer-queue' },
        { label: 'Organization review', view: 'org-review-queue' },
      ] as const).map(item => <button type="button" key={item.view} className="auth-demo-option" onClick={() => onInternal(item.view)}>
        <span className="text-sm font-semibold">{item.label}</span>
      </button>)}</div>
    </details>
  </div>
}
export function Login({ navigate }: LoginProps) {
 const {login,openPersona}=useClient()
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[showPw,setShowPw]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[demoOpen,setDemoOpen]=useState(false)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try { const member = await login(email, password); navigate(contactComplete(member) ? 'dashboard' : 'otp') }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.') }
    finally { setLoading(false) }
  }


 return <AuthLayout><div className="auth-card"><div className="mb-6"><p className="tcs-label mb-2">Your TCS account</p><h1 className="auth-title">Welcome back</h1><p className="auth-intro">Sign in to continue your journey.</p></div>
              {error && <Alert type="error" className="mb-4">{error}</Alert>}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Field label="Email address" required>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>

                <Field label="Password" required>
                  <Input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    suffix={
                      <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} onClick={() => setShowPw(!showPw)} className="text-xs font-bold text-[var(--tcs-brand)] hover:text-[var(--tcs-brand-800)]">
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    }
                  />
                </Field>

                <div className="flex justify-end">
                  <button type="button" className="tcs-link text-sm" onClick={() => setError('Password recovery needs a connected account service. For this local prototype, use your session password or create another sample account.')}>Forgot password?</button>
                </div>

                <Button type="submit" size="lg" loading={loading} className="w-full">
                  Sign in
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[var(--tcs-text-muted)]">
                New to TCS?{' '}
                <button onClick={() => navigate('signup')} className="tcs-link">Create an account</button>
              </p>

</div><div className="auth-utilities"><Button variant="secondary" onClick={()=>setDemoOpen(true)} aria-haspopup="dialog" aria-expanded={demoOpen}>Use demo account</Button></div>{demoOpen&&<Dialog label="Use demo account" onClose={()=>setDemoOpen(false)}><DemoAccounts
  onSelect={id=>{openPersona(id);setDemoOpen(false);navigate('dashboard')}}
  onOrganization={()=>{openPersona('verified');setDemoOpen(false);navigate('org-opportunity')}}
  onInternal={view=>{setDemoOpen(false);navigate(view)}}
/></Dialog>}</AuthLayout>
}
