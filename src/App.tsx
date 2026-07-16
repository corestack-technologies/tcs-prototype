import { useState } from 'react'
import { Login } from './components/Login'
import { Signup } from './components/Signup'
import { OTPVerification } from './components/OTPVerification'
import { OnboardingWizard } from './components/OnboardingWizard'
import { SuccessPage } from './components/SuccessPage'
import { ClientDashboard } from './components/thrift/ClientDashboard'
import { DiscoverCommunities } from './components/thrift/DiscoverCommunities'
import { CommunityDetail } from './components/thrift/CommunityDetail'
import { JoinRequest } from './components/thrift/JoinRequest'
import { JoinRequestSubmitted } from './components/thrift/JoinRequestSubmitted'
import { PendingApproval } from './components/thrift/PendingApproval'
import { MyGroups } from './components/thrift/MyGroups'
import { GroupDetail } from './components/thrift/GroupDetail'
import { ContributionSchedule } from './components/thrift/ContributionSchedule'
import { ContributionDetail } from './components/thrift/ContributionDetail'
import { PaymentConfirmation } from './components/thrift/PaymentConfirmation'
import { PaymentGateway } from './components/thrift/PaymentGateway'
import { ContributionHistory } from './components/thrift/ContributionHistory'
import { PayoutPosition } from './components/thrift/PayoutPosition'
import { GroupTimeline } from './components/thrift/GroupTimeline'
import { ReviewerQueue } from './components/ReviewerQueue'
import { ReviewerDetail } from './components/ReviewerDetail'
// Epic 4 — Organization journey
import { OrgOpportunity } from './components/org/OrgOpportunity'
import { OrgApplication } from './components/org/OrgApplication'
import { OrgReviewStatus } from './components/org/OrgReviewStatus'
import { OrgActivation } from './components/org/OrgActivation'
import { OwnerDashboard } from './components/org/OwnerDashboard'
import { OwnerGroups } from './components/org/OwnerGroups'
import { OwnerJoinRequests } from './components/org/OwnerJoinRequests'
import { OwnerVerification } from './components/org/OwnerVerification'
import { OwnerPayouts } from './components/org/OwnerPayouts'
import { OwnerCycles } from './components/org/OwnerCycles'
import { OwnerProfile } from './components/org/OwnerProfile'
import { OwnerSettings } from './components/org/OwnerSettings'
// Epic 4 refinements — internal TCS org review
import { OrgApplicationQueue } from './components/org/OrgApplicationQueue'
import { OrgApplicationDetail } from './components/org/OrgApplicationDetail'
import { OrgEligibility } from './components/org/OrgEligibility'
// Epic 5 — Group lifecycle & cycle launch
import { GroupSetupWizard } from './components/org/GroupSetupWizard'
import { GroupRecruitment } from './components/org/GroupRecruitment'
import { GroupPositions } from './components/org/GroupPositions'
import { GroupRulesReview } from './components/org/GroupRulesReview'
import { GroupReadiness } from './components/org/GroupReadiness'
import { GroupActivated } from './components/org/GroupActivated'
// Epic 6 — Contribution collection
import { OwnerCollectionDashboard } from './components/org/OwnerCollectionDashboard'
import { OwnerCollectionHistory } from './components/org/OwnerCollectionHistory'

export type View =
  | 'login' | 'signup' | 'otp' | 'onboarding' | 'success'
  | 'dashboard' | 'dashboard-new'
  | 'discover' | 'community-detail' | 'join-request' | 'join-submitted' | 'pending-approval'
  | 'my-groups' | 'group-detail' | 'contribution-schedule' | 'contribution-detail'
  | 'payment-confirmation' | 'contribution-history' | 'payout-position' | 'group-timeline'
  | 'reviewer-queue' | 'reviewer-detail'
  // Epic 4
  | 'org-opportunity' | 'org-application' | 'org-review' | 'org-activation'
  | 'owner-dashboard' | 'owner-groups'
  | 'owner-join-requests' | 'owner-verification' | 'owner-payouts'
  | 'owner-cycles' | 'owner-profile' | 'owner-settings'
  // Internal TCS org review
  | 'org-review-queue' | 'org-review-detail' | 'org-eligibility'
  // Epic 5 — Group lifecycle
  | 'owner-group-setup' | 'owner-group-recruit' | 'owner-group-positions'
  | 'owner-group-rules' | 'owner-group-readiness' | 'owner-group-activated'
  // Epic 6 — Contribution collection
  | 'payment-gateway' | 'owner-collection' | 'owner-collection-history'

export interface NavMeta {
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
  const [view, setView] = useState<View>('login')
  const [meta, setMeta] = useState<NavMeta>({})

  const navigate = (v: View, m: NavMeta = {}) => {
    setMeta(m)
    setView(v)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      {/* Auth */}
      {view === 'login'                && <Login navigate={navigate} />}
      {view === 'signup'               && <Signup navigate={navigate} />}
      {view === 'otp'                  && <OTPVerification navigate={navigate} />}
      {view === 'onboarding'           && <OnboardingWizard navigate={navigate} />}
      {view === 'success'              && <SuccessPage navigate={navigate} />}
      {/* Member experience */}
      {view === 'dashboard'            && <ClientDashboard navigate={navigate} mode="active" />}
      {view === 'dashboard-new'        && <ClientDashboard navigate={navigate} mode="new" />}
      {view === 'discover'             && <DiscoverCommunities navigate={navigate} />}
      {view === 'community-detail'     && <CommunityDetail navigate={navigate} communityId={meta.communityId} />}
      {view === 'join-request'         && <JoinRequest navigate={navigate} communityId={meta.communityId} />}
      {view === 'join-submitted'       && <JoinRequestSubmitted navigate={navigate} communityId={meta.communityId} />}
      {view === 'pending-approval'     && <PendingApproval navigate={navigate} />}
      {view === 'my-groups'            && <MyGroups navigate={navigate} />}
      {view === 'group-detail'         && <GroupDetail navigate={navigate} groupId={meta.groupId} />}
      {view === 'contribution-schedule'&& <ContributionSchedule navigate={navigate} groupId={meta.groupId} />}
      {view === 'contribution-detail'  && <ContributionDetail navigate={navigate} groupId={meta.groupId} roundId={meta.roundId} />}
      {view === 'payment-confirmation' && <PaymentConfirmation navigate={navigate} groupId={meta.groupId} roundId={meta.roundId} confirmMode={meta.confirmMode} />}
      {view === 'payment-gateway'      && <PaymentGateway navigate={navigate} groupId={meta.groupId} roundId={meta.roundId} payAmount={meta.payAmount} />}
      {view === 'contribution-history' && <ContributionHistory navigate={navigate} />}
      {view === 'payout-position'      && <PayoutPosition navigate={navigate} groupId={meta.groupId} />}
      {view === 'group-timeline'       && <GroupTimeline navigate={navigate} groupId={meta.groupId} />}
      {/* Internal reviewer */}
      {view === 'reviewer-queue'       && <ReviewerQueue navigate={navigate} />}
      {view === 'reviewer-detail'      && <ReviewerDetail navigate={navigate} clientId={meta.clientId ?? null} />}
      {/* Epic 4 — Organization journey */}
      {view === 'org-opportunity'      && <OrgOpportunity navigate={navigate} />}
      {view === 'org-application'      && <OrgApplication navigate={navigate} />}
      {view === 'org-review'           && <OrgReviewStatus navigate={navigate} status={meta.orgStatus} />}
      {view === 'org-activation'       && <OrgActivation navigate={navigate} />}
      {/* Owner workspace */}
      {view === 'owner-dashboard'      && <OwnerDashboard navigate={navigate} />}
      {view === 'owner-groups'         && <OwnerGroups navigate={navigate} />}
      {view === 'owner-join-requests'  && <OwnerJoinRequests navigate={navigate} />}
      {view === 'owner-verification'   && <OwnerVerification navigate={navigate} />}
      {view === 'owner-payouts'        && <OwnerPayouts navigate={navigate} />}
      {view === 'owner-cycles'         && <OwnerCycles navigate={navigate} />}
      {view === 'owner-profile'        && <OwnerProfile navigate={navigate} />}
      {view === 'owner-settings'       && <OwnerSettings navigate={navigate} />}
      {/* Epic 5 — Group lifecycle & cycle launch */}
      {view === 'owner-group-setup'     && <GroupSetupWizard navigate={navigate} />}
      {view === 'owner-group-recruit'   && <GroupRecruitment navigate={navigate} />}
      {view === 'owner-group-positions' && <GroupPositions navigate={navigate} />}
      {view === 'owner-group-rules'     && <GroupRulesReview navigate={navigate} />}
      {view === 'owner-group-readiness' && <GroupReadiness navigate={navigate} />}
      {view === 'owner-group-activated' && <GroupActivated navigate={navigate} />}
      {/* Epic 6 — Contribution collection */}
      {view === 'owner-collection'         && <OwnerCollectionDashboard navigate={navigate} />}
      {view === 'owner-collection-history' && <OwnerCollectionHistory navigate={navigate} />}
      {/* Internal TCS org review */}
      {view === 'org-review-queue'     && <OrgApplicationQueue navigate={navigate} />}
      {view === 'org-review-detail'    && <OrgApplicationDetail navigate={navigate} clientId={meta.clientId} />}
      {view === 'org-eligibility'      && <OrgEligibility navigate={navigate} />}
    </div>
  )
}
