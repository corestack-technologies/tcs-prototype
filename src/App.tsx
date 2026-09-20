import { lazyRoute } from './design/lazyRoute'
import { WorkspaceBoundary } from './design/foundation'
import { GroupGuard } from './groups/GroupUI'
import { useGroups } from './groups/GroupContext'
import { useState } from 'react'
import { Login } from './components/Login'
import { Signup } from './components/Signup'
import { ClientContact } from './clients/ClientContact'
import { ClientSubmission } from './clients/ClientSubmission'
import { ClientHome } from './clients/ClientHome'
import { ClientVerification } from './clients/ClientVerification'
import { ClientProfile } from './clients/ClientProfile'
import { useOrganization } from './organizations/OrganizationContext'
import { useClient } from './clients/ClientContext'
import { DiscoverCommunities } from './components/thrift/DiscoverCommunities'
import { CommunityDetail } from './components/thrift/CommunityDetail'
import { JoinRequest } from './components/thrift/JoinRequest'
import { JoinRequestSubmitted } from './components/thrift/JoinRequestSubmitted'
import { PendingApproval } from './components/thrift/PendingApproval'
import { GroupDetail } from './components/thrift/GroupDetail'
import { ContributionSchedule } from './components/thrift/ContributionSchedule'

import { GroupTimeline } from './components/thrift/GroupTimeline'


// Epic 4 — Organization journey
import { OrgOpportunity } from './components/org/OrgOpportunity'
import { OrgReviewStatus } from './components/org/OrgReviewStatus'
import { OrgActivation } from './components/org/OrgActivation'
import { OwnerDashboard } from './components/org/OwnerDashboard'
import { OwnerJoinRequests } from './components/org/OwnerJoinRequests'
import { OwnerVerification } from './components/org/OwnerVerification'

import { OwnerProfile } from './components/org/OwnerProfile'
import { OwnerSettings } from './components/org/OwnerSettings'
// Epic 4 refinements — internal TCS org review


import { OrgEligibility } from './components/org/OrgEligibility'
// Epic 5 — Group lifecycle & cycle launch
import { GroupRecruitment } from './components/org/GroupRecruitment'
import { GroupPositions } from './components/org/GroupPositions'
import { GroupRulesReview } from './components/org/GroupRulesReview'
import { GroupReadiness } from './components/org/GroupReadiness'
import { GroupActivated } from './components/org/GroupActivated'
// Epic 6 — Contribution collection



const ScheduledProcessesWorkspace = await lazyRoute(() => import('./processes/ScheduledProcessesWorkspace').then(module => ({default:module.ScheduledProcessesWorkspace})))
const DiagnosticsWorkspace = await lazyRoute(() => import('./processes/DiagnosticsWorkspace').then(module => ({default:module.DiagnosticsWorkspace})))
const SettingsWorkspace = await lazyRoute(() => import('./settings/SettingsWorkspace').then(module => ({default:module.SettingsWorkspace})))
const InternalReportsWorkspace = await lazyRoute(() => import('./reports/InternalReportsWorkspace').then(module => ({default:module.InternalReportsWorkspace})))
const ReportsWorkspace = await lazyRoute(() => import('./reports/ReportsWorkspace').then(module => ({default:module.ReportsWorkspace})))
const AccessWorkspace = await lazyRoute(() => import('./access/AccessWorkspace').then(module => ({default:module.AccessWorkspace})))
const OperationsWorkspace = await lazyRoute(() => import('./operations/OperationsWorkspace').then(module => ({default:module.OperationsWorkspace})))
const ReconciliationWorkspace = await lazyRoute(() => import('./reconciliation/ReconciliationWorkspace').then(module => ({default:module.ReconciliationWorkspace})))
const PayoutWorkspace = await lazyRoute(() => import('./payouts/PayoutWorkspace').then(module => ({default:module.PayoutWorkspace})))
const PaymentWorkspace = await lazyRoute(() => import('./payments/PaymentWorkspace').then(module => ({default:module.PaymentWorkspace})))
const LifecycleWorkspace = await lazyRoute(() => import('./lifecycle/LifecycleWorkspace').then(module => ({default:module.LifecycleWorkspace})))

const GroupSetupWizard = await lazyRoute(() => import('./components/org/GroupSetupWizard').then(module => ({default:module.GroupSetupWizard})))

const OrgApplication = await lazyRoute(() => import('./components/org/OrgApplication').then(module => ({default:module.OrgApplication})))

const ClientOnboarding = await lazyRoute(() => import('./clients/ClientOnboarding').then(module => ({default:module.ClientOnboarding})))

const ActiveCycleWorkspace = await lazyRoute(() => import('./rounds/ActiveCycleWorkspace').then(module => ({default:module.ActiveCycleWorkspace})))

const MemberGroups = await lazyRoute(() => import('./rounds/ActiveCycleWorkspace').then(module => ({default:module.MemberGroups})))

const OwnerGroups = await lazyRoute(() => import('./components/org/OwnerGroups').then(module => ({default:module.OwnerGroups})))

export type View =
 | 'settings' | 'scheduled-processes' | 'diagnostics'
  | 'internal-reports' | 'member-reports' | 'owner-reports'
  | 'security'
  | 'access-management'
  | 'operations'
  | 'login' | 'signup' | 'otp' | 'onboarding' | 'success'
  | 'dashboard' | 'dashboard-new' | 'client-profile' | 'client-verification'
  | 'discover' | 'community-detail' | 'join-request' | 'join-submitted' | 'pending-approval'
  | 'my-groups' | 'group-detail' | 'contribution-schedule' | 'contribution-detail'
  | 'payment-confirmation' | 'contribution-history' | 'payout-position' | 'group-timeline'
  | 'reviewer-queue' | 'reviewer-detail'
  // Epic 4
  | 'org-opportunity' | 'org-application' | 'org-review' | 'org-activation'
  | 'owner-dashboard' | 'owner-groups'
  | 'owner-reconciliation' | 'owner-join-requests' | 'owner-verification' | 'owner-payouts'
  | 'owner-lifecycle' | 'member-lifecycle' | 'owner-cycles' | 'owner-profile' | 'owner-settings'
  // Internal TCS org review
  | 'org-review-queue' | 'org-review-detail' | 'org-eligibility'
  // Epic 5 — Group lifecycle
  | 'owner-group-setup' | 'owner-group-recruit' | 'owner-group-positions'
  | 'owner-group-rules' | 'owner-group-readiness' | 'owner-group-activated'
  // Epic 6 — Contribution collection
  | 'member-payouts' | 'member-payments' | 'payment-gateway' | 'owner-collection' | 'owner-collection-history'

export interface NavMeta {
  caseId?: string
  clientId?: string
  communityId?: string
  groupId?: string
  roundId?: string
  confirmMode?: 'auto' | 'pending'
  payAmount?: number
  mode?: string
  orgStatus?: 'submitted' | 'pending' | 'info-required' | 'approved' | 'rejected'
}

export default function App() {
  const { client, logout } = useClient()
  const { organization, scenario } = useOrganization()
  const [view, setView] = useState<View>(window.location.pathname === '/operations/scheduled-processes' ? 'scheduled-processes' : window.location.pathname === '/settings/diagnostics' ? 'diagnostics' : window.location.pathname === '/settings' ? 'settings' : window.location.pathname === '/reports/internal' ? 'internal-reports' : window.location.pathname === '/reports/member' ? 'member-reports' : window.location.pathname === '/reports/organization' ? 'owner-reports' : window.location.pathname === '/access-management/security' ? 'security' : window.location.pathname === '/access-management' ? 'access-management' : window.location.pathname === '/operations' ? 'operations' : 'login')
  const [meta, setMeta] = useState<NavMeta>({})

  const navigate = (v: View, m: NavMeta = {}) => {
    if (v === 'login') logout()
    setMeta(m)
    setView(v)
    window.scrollTo(0, 0)
  }

  const clientViews: View[] = ['member-reports','member-payouts','payout-position','contribution-detail','payment-confirmation','payment-gateway','contribution-history','member-payments','member-lifecycle','my-groups','group-detail','otp', 'onboarding', 'success', 'dashboard', 'dashboard-new', 'client-profile', 'client-verification']
  const { group: selectedGroup } = useGroups()
  const organizationViews: View[] = ['owner-reports','owner-reconciliation','owner-payouts','owner-collection','owner-collection-history','owner-lifecycle','owner-cycles','owner-groups','owner-group-setup','owner-group-recruit','owner-group-positions','owner-group-rules','owner-group-readiness','owner-group-activated','org-opportunity', 'org-application', 'org-review', 'org-activation', 'owner-dashboard', 'owner-profile', 'owner-settings']
  if ((clientViews.includes(view) || organizationViews.includes(view)) && !client) return <Login navigate={navigate} />

  return (
    <div key={organizationViews.includes(view) ? `${client?.id}:${scenario}:${organization?.id ?? "entry"}:${selectedGroup?.id ?? "no-group"}` : undefined} className="min-h-screen bg-[#F4F6FA]">
      <WorkspaceBoundary key={view} onReturn={()=>navigate(client ? "dashboard" : "login")}>
      {(['operations','reviewer-queue','reviewer-detail','org-review-queue','org-review-detail'] as View[]).includes(view) && <OperationsWorkspace key={meta.caseId} navigate={navigate} initialCaseId={meta.caseId} />}
      {view === 'security' && <AccessWorkspace key='security' navigate={navigate} initialTab='Security' />}
      {view === 'scheduled-processes' && <ScheduledProcessesWorkspace navigate={navigate} />}
      {view === 'diagnostics' && <DiagnosticsWorkspace navigate={navigate} />}
      {view === 'settings' && <SettingsWorkspace navigate={navigate} />}
      {view === 'access-management' && <AccessWorkspace navigate={navigate} />}
      {view === 'internal-reports' && <InternalReportsWorkspace navigate={navigate} />}
      {view === 'member-reports' && <ReportsWorkspace navigate={navigate} />}
      {view === 'owner-reports' && <ReportsWorkspace navigate={navigate} owner />}
      {/* Auth */}
      {view === 'login'                && <Login navigate={navigate} />}
      {view === 'signup'               && <Signup navigate={navigate} />}
      {view === 'otp'                  && <ClientContact navigate={navigate} />}
      {view === 'onboarding'           && <ClientOnboarding navigate={navigate} />}
      {view === 'success'              && <ClientSubmission navigate={navigate} />}
      {/* Member experience */}
      {(view === 'dashboard' || view === 'dashboard-new') && <ClientHome navigate={navigate} />}
      {view === 'client-verification' && <ClientVerification navigate={navigate} />}
      {view === 'client-profile' && <ClientProfile navigate={navigate} />}
      {view === 'discover'             && <DiscoverCommunities navigate={navigate} />}
      {view === 'community-detail'     && <CommunityDetail navigate={navigate} communityId={meta.communityId} />}
      {view === 'join-request'         && <JoinRequest navigate={navigate} communityId={meta.communityId} />}
      {view === 'join-submitted'       && <JoinRequestSubmitted navigate={navigate} communityId={meta.communityId} />}
      {view === 'pending-approval'     && <PendingApproval navigate={navigate} />}
      {view === 'my-groups'            && <MemberGroups navigate={navigate} />}
      {view === 'group-detail'         && (selectedGroup && (!meta.groupId || selectedGroup.id===meta.groupId) ? <ActiveCycleWorkspace navigate={navigate} member /> : <GroupDetail navigate={navigate} groupId={meta.groupId} />)}
      {view === 'contribution-schedule'&& <ContributionSchedule navigate={navigate} groupId={meta.groupId} />}
      {view === 'contribution-detail'  && <PaymentWorkspace navigate={navigate} roundId={meta.roundId} />}
      {view === 'payment-confirmation' && <PaymentWorkspace navigate={navigate} roundId={meta.roundId} />}
      {view === 'payment-gateway'      && <PaymentWorkspace navigate={navigate} roundId={meta.roundId} />}
      {view === 'contribution-history' && <PaymentWorkspace navigate={navigate} />}
      {view === 'payout-position'      && <PayoutWorkspace navigate={navigate} />}
      {view === 'group-timeline'       && <GroupTimeline navigate={navigate} groupId={meta.groupId} />}
      {/* Internal reviewer */}
      {/* Epic 4 — Organization journey */}
      {view === 'org-opportunity'      && <OrgOpportunity navigate={navigate} />}
      {view === 'org-application'      && <OrgApplication navigate={navigate} />}
      {view === 'org-review'           && <OrgReviewStatus navigate={navigate} />}
      {view === 'org-activation'       && <OrgActivation navigate={navigate} />}
      {/* Owner workspace */}
      {view === 'owner-dashboard'      && <OwnerDashboard navigate={navigate} />}
      {view === 'owner-groups'         && <OwnerGroups navigate={navigate} />}
      {view === 'owner-join-requests'  && <OwnerJoinRequests navigate={navigate} />}
      {view === 'owner-verification'   && <OwnerVerification navigate={navigate} />}
      {view === 'owner-reconciliation' && <ReconciliationWorkspace navigate={navigate} />}
      {view === 'owner-payouts'        && <PayoutWorkspace navigate={navigate} owner />}
      {view === 'owner-lifecycle' && <LifecycleWorkspace navigate={navigate} />}
      {view === 'member-payouts' && <PayoutWorkspace navigate={navigate} />}
      {view === 'member-payments' && <PaymentWorkspace navigate={navigate} roundId={meta.roundId} />}
      {view === 'member-lifecycle' && <LifecycleWorkspace navigate={navigate} member />}
      {view === 'owner-cycles'         && <ActiveCycleWorkspace navigate={navigate} />}
      {view === 'owner-profile'        && <OwnerProfile navigate={navigate} />}
      {view === 'owner-settings'       && <OwnerSettings navigate={navigate} />}
      {/* Epic 5 — Group lifecycle & cycle launch */}
      {view === 'owner-group-setup'     && <GroupGuard navigate={navigate} ><GroupSetupWizard navigate={navigate} /></GroupGuard>}
      {view === 'owner-group-recruit'   && <GroupGuard navigate={navigate} ><GroupRecruitment navigate={navigate} /></GroupGuard>}
      {view === 'owner-group-positions' && <GroupGuard navigate={navigate} ><GroupPositions navigate={navigate} /></GroupGuard>}
      {view === 'owner-group-rules'     && <GroupGuard navigate={navigate} ><GroupRulesReview navigate={navigate} /></GroupGuard>}
      {view === 'owner-group-readiness' && <GroupGuard navigate={navigate} ><GroupReadiness navigate={navigate} /></GroupGuard>}
      {view === 'owner-group-activated' && <GroupGuard navigate={navigate} allowLocked><GroupActivated navigate={navigate} /></GroupGuard>}
      {/* Epic 6 — Contribution collection */}
      {view === 'owner-collection'         && <PaymentWorkspace navigate={navigate} owner roundId={meta.roundId} />}
      {view === 'owner-collection-history' && <PaymentWorkspace navigate={navigate} owner />}
      {/* Internal TCS org review */}
      {view === 'org-eligibility'      && <OrgEligibility navigate={navigate} />}
      </WorkspaceBoundary>
    </div>
  )
}
