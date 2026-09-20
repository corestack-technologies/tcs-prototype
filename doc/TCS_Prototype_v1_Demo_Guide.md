# TCS Prototype v1 Demo Guide

Stage 7: Demo Preparation. This guide uses the completed prototype and existing scenarios. It is not a production launch or prototype freeze.

Product direction: [MVP Constitution baseline](constitution/TCS_Product_Constitution_MVP_Baseline_v0.3.md). Prior validation context: [Stage 6 whole-app QA](Prototype_Closure_Stage_6_Whole_App_QA.md).

## 1. Product summary

**One line:** TCS coordinates structured thrift/Ajo activity through shared records of membership, contribution obligations, payout order and financial history.

**30 seconds:** TCS gives Members and thrift Organizations a shared, structured view of their activity. Members can understand their Positions, contributions and payout history. Organizations coordinate Groups, monitor collections, record payouts and follow up exceptions. Internal teams oversee permitted cases and reporting. TCS is not a bank or wallet and does not hold Members' thrift funds. This prototype demonstrates the product behaviour; external financial and operational integrations remain part of the production build.

**Two minutes:** Thrift activity depends on people understanding what they have agreed to contribute, when it is due and when they are scheduled to receive a payout. TCS brings those records into one coordinated experience, reducing reliance on fragmented WhatsApp conversations and spreadsheets.

A Member can see their account and verification status, Group participation, agreed Position, contribution obligations and payout history. The distinction between an obligation, a confirmed contribution and a payout makes the financial story easier to follow.

An Organization has its own workspace for preparing Groups, recruiting participants, assigning Positions, confirming rules and checking readiness before activation. During an active Cycle, it can monitor Round collections, record externally made payouts and follow up disputes or outstanding responsibilities. Reports provide another view of those records rather than a separate financial story.

Internal TCS workspaces support permission-controlled review, exception oversight, reporting and access administration. More advanced operational controls support UAT and operational scenarios; they are not the main customer journey.

TCS coordinates and records thrift activity. It is not a bank, wallet or custodian. Under the MVP model, Organizations remain responsible for manual payouts. The prototype models provider-driven payments and reconciliation without moving real money. Live payment, KYC, notification, persistence, scheduler and security infrastructure belong to the production build. The product behaviour has automated validation; that is distinct from production readiness or regulatory approval.

## 2. Product positioning

- TCS coordinates thrift/Ajo; it does not hold Members' thrift funds.
- The production direction uses licensed payment providers. Live Paystack/provider integration and settlement are future build work.
- Organizations remain responsible for making payouts under the manual MVP model. Recording a transfer is distinct from evidence that a Member received it.
- Provider confirmation, contribution allocation and provider settlement are separate states. Ordinary successful contributions do not require discretionary Owner approval.
- Membership and financial responsibilities are governed by the agreed Group/Cycle rules. Neither a restricted account nor a completed Cycle implies outstanding liabilities disappeared.

## 3. Demo personas and entry points

Start at the public login page. Use **Use demo account**; the selector contains **Member demos**, **Organization demos** and **TCS Internal demos**. Organization and Internal options stay collapsed until needed. Close scenario helpers before presenting the workspace. There is no separate public Internal access control.

Most navigation uses in-memory view identifiers, not browser URL paths. Use the buttons below; do not invent deep links such as `/dashboard`. Refreshing a prepared session loses its in-memory edits and added scenarios.

| Persona / existing scenario | Entry and destination | Purpose and talking point |
| --- | --- | --- |
| New Member (`new`, `new@tcs.ng`) | Member demos → Onboarding → New Member; view `dashboard` | Account/onboarding starting point. A new account has no established financial history. |
| Verified / active (`verified`, `member@tcs.ng`) | Member demos → Existing Member → Verified / active; `dashboard`, then My Groups | Primary Member story: verification, participation, obligations and financial records. Also the participating Owner in the prepared financial scenarios. |
| Restricted Member (`restricted`, `restricted@tcs.ng`) | Member demos → Existing Member → Restricted Member | Illustrates account restrictions. This independent account fixture is not proof of a particular Recovery case. |
| Recovery example: participating Owner | Verified Member in the active Organization world, after adding `Post-payout default / recovery`; My Groups → selected Cycle | Shows an existing seeded Recovery case. Keep this separate from the independent Restricted Member fixture. |
| Approved Organization Owner | Organization demos → Organization → Organization demo scenarios → Review scenario → `Olahbee’s World · approved / setup` → Complete Organization setup (`org-activation`) | Approval precedes completion of Organization setup. Optional branch, not the primary financial world. |
| Owner with active Group/Cycle | Same entry, select `Olahbee’s World · active workspace` → Enter Organization workspace (`owner-dashboard`); prepare Groups below | Primary Organization story. Active Organization status alone does not create active shared financial Groups. |
| Operations Reviewer | TCS Internal demos → Operations (`/operations`); expand Demo user selection and choose Chidi / Financial Operations Reviewer, or Dami / Operations Supervisor | Review financial cases and exceptions with the actor's existing permissions. |
| Verification Reviewer | TCS Internal demos → Verification review (`reviewer-queue` view); choose Bola / Verification Reviewer where needed | Optional KYC review branch. Organization review remains available separately. |
| Access Administrator | TCS Internal demos → Access Management (`/access-management`); choose Evelyn / Access Administrator | Users, roles and permission boundaries. Do not grant roles merely to speed up a demo. |
| Business Date operator | Internal Demo user selection → Kemi / Platform Settings Administrator, then Settings (`/settings`); Ngozi / Business Date Manager is the narrower alternative | Optional non-production date controls. This role does not automatically grant Scheduled Process execution. |
| Process operator | Switch to Chidi or Dami → Operations → Scheduled Processes (`/operations/scheduled-processes`) | Optional run/history inspection with explicit process authority. |

All other existing Member examples remain available: incomplete, verification required, pending review, information required, declined and suspended. Internal test users and Organization scenarios remain available in their secondary selectors. They are not necessary for the main presentation.

### Presenter preparation: one coherent financial world

1. Start the local app with `npm.cmd run dev` on Windows (default port 8443). Open the app and use the compact selector. Use demo controls rather than presenting sample passwords or OTPs as production authentication.
2. Select Organization, then `Olahbee’s World · active workspace`. Enter the workspace. Keep this Organization scenario selected throughout the financial story: different Organization scenarios have independent session data.
3. Open **Groups → Prototype scenario tools → Contribution payment demo scenarios**. Select **Exact contribution / settlement pending**, then **Add payment demo**. This creates `Contribution Circle · Exact contribution / settlement pending` and selects it. Use this Group for the contribution and collection story.
4. Open **Payouts → Manual payout demo scenarios**. Select **Transfer awaiting confirmation**, then **Add payout demo**. Use this selected Group for the payout story. It intentionally represents a different scenario from the contribution Group. Note its Group ID and status before leaving: several payout scenarios reuse the same base Group name.
5. For the full presentation, add **Disputed payout** from the same payout selector, and note its Group ID separately. This supplies a real seeded exception for Operations. Do not assume two identically named Groups are the same record.
6. Optional only: Groups → Prototype scenario tools → Lifecycle demo scenarios → **Post-payout default / recovery** → **Add lifecycle demo**. Note the selected Group ID. This fixture deliberately includes historical financial facts and a Recovery case; it is not a fresh provider-payment ledger.
7. Return to the contribution Group, then use **Personal workspace** to enter the same verified Member's dashboard. My Groups now has useful shared Groups. Use **Switch to Olahbee’s World** to return to the Owner workspace without selecting a different world.
8. Before the audience arrives, inspect the selected Group, Cycle, Position, obligation and report rows. Expand filters and clear date restrictions if necessary. Financial fixtures use an intentional isolated schedule beginning in **2099**; explain it as a scenario clock, not today's live activity. Do not change Business Date simply to make a fixture look current.
9. Collapse all demo helpers. Rehearse the Member → Owner → Internal handoffs. Do not refresh or restart the app after preparation.

For the full walkthrough's discovery/join example, demonstrate that branch **before** preparing shared financial Groups, or rehearse it in a separate fresh session. The empty My Groups page offers Explore Groups. Once Groups exist, that empty-state entry is no longer the starting point.

### Data interpretation checklist

Existing names and scenario values are retained. The standard Round fixture uses NGN 100,000 per full Position, four Positions and a split Position. The participating Owner holds two full Positions; a half Position contributes proportionately. Explain each selected Round's required and optional components rather than assuming one person always owes one full contribution.

Check the actual ordered Position list, beneficiary, due amount and payout status on screen. An awaiting-confirmation transfer must not be described as confirmed receipt. A settled provider record must not be confused with an Organization payout.

Member/Owner overview activity includes historical sample summaries. These are not aggregate totals of the shared Groups you just added. Use Group/Cycle details and their reports for financial comparisons. The legacy discovery/join screens are interaction examples, not a connected pipeline that creates the shared financial membership demonstrated later. State that handoff explicitly.

No seed corrections are required for this guide. Scenario dates, historical summaries and independent datasets are documented rather than rewritten. Scenario labels and simulated-provider wording are intentional; keep helper panels closed, but do not conceal simulation notices.

## 4. Short demo: 5–10 minutes

Use the prepared session above. Target eight minutes; omit the optional Recovery and platform controls.

| Time | Action | Say / show |
| --- | --- | --- |
| 0:00–0:45 | Member dashboard | Deliver the one-line summary and non-custody positioning. Show verification and the Member navigation; describe overview figures as sample history. |
| 0:45–2:15 | My Groups → contribution Group → Open my Cycle; open its active Cycle details | Show the Member's Position, agreed schedule and required contribution. A Position determines participation and payout order. |
| 2:15–3:30 | Payments, then the prepared payout Group's Payouts | Show the confirmed contribution and separate settlement-pending state. Show transfer awaiting Member confirmation; no real money moved. |
| 3:30–5:00 | Switch to Olahbee’s World → Groups → same contribution Group → Collections / Active Cycle | The Organization sees Round obligations and collection progress for the same shared records. |
| 5:00–6:15 | Organization Reports; optionally Member Reports on the return switch | Select the same Group and compare a contribution or obligation row with its source. Do not compare unrelated dashboard totals. |
| 6:15–8:00 | Return through login → Use demo account → TCS Internal demos → Operations; select Chidi | Show oversight and one available case. If no disputed scenario was prepared, show the dashboard honestly rather than promising an open dispute. Close with the production-integration distinction. |

## 5. Full demo: 20–30 minutes

Target 27 minutes. Show one representative record per workspace, not every screen.

1. **Introduction and Member entry (0–3 minutes).** Give the 30-second description. Briefly show New Member and verification status; switch to Verified / active. Keep demo helpers closed afterward.
2. **Requestable Group / join interaction (3–5 minutes).** In a fresh world, My Groups → Explore Groups → a requestable Group → Join Request → submitted/pending state. Show the terms and expected membership decision. Explain that this legacy interaction example is separate from the shared financial scenarios used next; do not claim this request became the next Group's membership.
3. **Established Member participation (5–10 minutes).** Use the prepared shared financial world. If presenting in a single session, pause screen sharing briefly and perform the preparation checklist now. Show My Groups, Position, Cycle schedule, required obligation, contribution status, then the awaiting-confirmation payout fixture and Member report. Optional receipt confirmation changes that fixture; inspect the action rather than submit it unless rehearsed.
4. **Organization context and preparation (10–15 minutes).** Switch to the same Organization. Show Profile, Groups and the setup entry. For a concise prepared example, use **Group preparation demo tools**, select **Ready for activation**, and add the demo Group. Inspect Recruitment, Positions, Rules and Readiness using the existing preparation navigation. Explain commitments and activation gates. Do not activate just to fill time. The separate approved/setup Organization scenario can replace this segment for an onboarding-focused audience; return to the active world afterward.
5. **Organization financial operations (15–20 minutes).** Reselect the original contribution Group. Show active Round, Collections and separate settlement state; then select the prepared payout Group to show transfer evidence and recipient response status. Optional: inspect the seeded post-payout default case and outstanding principal/penalty/Recovery separately. Do not run an unrehearsed settlement or clearance decision.
6. **Reporting (20–23 minutes).** Open Organization Reports for the same Group. Compare contributions, obligations and payouts with their source records. Briefly show the corresponding Member scope. Keep reference, Group/Cycle and date basis consistent.
7. **Internal oversight (23–27 minutes).** Enter Operations through the compact selector, choose Chidi and open the prepared disputed payout case. Inspect evidence, status and available permitted actions without resolving it. Show an Internal report, then switch to Evelyn for a short Access Management view. Permission differences are part of the product story.
8. **Optional advanced close (up to 30 minutes).** Choose Kemi for Settings, Business Date and Diagnostics. Choose Chidi or Dami separately for Scheduled Processes and run history. Describe UAT/operational capability. Inspect only by default; running processes or advancing dates can mutate prepared records. Close with the launch-work distinction, not a claim of production readiness.

## 6. Key talking points and reporting demonstration

| Area | Emphasize |
| --- | --- |
| Member | Clear obligations, agreed Positions, visible contribution status and payout history. |
| Organization | Structured coordination replaces scattered records; recruitment, commitments and readiness precede activation. |
| Payments | Provider success, allocation and settlement are distinct. Show the prototype's simulated provider evidence. |
| Payouts | The Organization transfers externally; TCS records evidence and recipient response. Scheduled entitlement, fees, net amount and receipt are distinct. |
| Defaults / Recovery | Outstanding responsibilities remain visible after payout or Cycle completion. Recovery does not silently erase history. |
| Operations | Exceptions have evidence, status and permission-controlled actions. Oversight is not unrestricted financial editing. |
| Reports | Traceable records with audience-specific scope; use identical Group/Cycle and filters when comparing figures. |

For reports, use Member Reports (`/reports/member`), Organization Reports (`/reports/organization`) and Internal Reports (`/reports/internal`) through their workspace navigation and authorized persona. Direct path entry does not bypass identity or permission checks.

- **Contributions:** compare recorded payment, allocated amount, unallocated amount, provider reference and settlement state.
- **Obligations:** distinguish original principal, satisfied principal, Recovery applied and net principal outstanding; keep penalties separate.
- **Payouts:** distinguish scheduled entitlement, agreed fee, expected net, recorded transfer, evidenced receipt and source outstanding.
- Clear period filters that would exclude the fixture's 2099 dates. Different report date bases can produce different selections; compare a specific source record before discussing totals.
- Use the Recovery fixture to explain retained liabilities, not to claim every historical fact has a matching fresh payment-provider transaction.

If asked about penalties: the prototype supports simple, non-compounding daily accrual on outstanding required principal. The Group range is 0–10 bps/day, with a prototype ceiling of 10 bps/day (0.10%) and suitable demo defaults of 5 bps/day (0.05%). Show the selected Group's explicit rule rather than assuming all Groups have the same rate. The ceiling is a prototype policy value requiring review before production.

## 7. Features not to over-explain

Keep fee distribution details, penalty arithmetic, process internals, every lifecycle edge case, security simulations and the entire role matrix out of the main story. Explain them only when relevant to the audience's question. Do not lead with Business Date, Diagnostics, scenario selectors or sample OTPs. Do not describe internal view IDs during a customer presentation.

For Organizations, spend more time on coordination and collection visibility. For partners/providers, expand payment, settlement and payout distinctions. For developers, expand source records, permissions and the documented integration boundaries. These are variations of the same product story, not separate feature promises.

## 8. Prototype and integration disclaimer

Suggested spoken wording: **“This prototype demonstrates validated product behaviour. Production integrations remain part of the build phase; no real money is moving in this demonstration.”**

| Demonstrated behaviour | Infrastructure boundary |
| --- | --- |
| Account, verification states and review workflows | Production identity/KYC provider connection is not live. |
| Contribution attempts, confirmation, allocation and reconciliation | Provider events are simulated. Live Paystack/provider payments and settlement belong to production. |
| Manual payout recording, recipient response and disputes | No bank API executes these demo transfers. Organizations remain responsible for MVP payouts. |
| Notification-related interface and operational records | Production Email, SMS and WhatsApp are planned; do not claim live delivery. |
| Shared session records and audit history | Prototype data is in memory, not a persistent production database. |
| Business Date and Scheduled Process workflows | These model UAT/operational behaviour, not a deployed production scheduler. |
| Permissions and security workflows | Demo persona switching and simulated security controls are not live production identity/security infrastructure. |

Do not claim regulatory approval, guaranteed returns, custody, bank status or production readiness. Existing benefit copy describes the intended product direction; qualify payment and reminder claims using the boundaries above.

## 9. Reset, repeatability and presenter recovery

- Navigation, persona switching and sign-out do not constitute a full data reset. Re-enter the same Member and Organization scenario to recover the prepared session.
- A full browser refresh resets in-memory changes, added Groups, internal changes and process runs to initial state. Start from the public entry and repeat the checklist after a refresh. This is not a production persistence promise.
- Adding a scenario again creates another example; it is not an undo button. Repeated additions can yield similar Group names. Record Group IDs or refresh and prepare a clean session before the next presentation.
- Switching the Organization review scenario selects an independent world. An apparently missing Group may belong to the earlier world; return to `active` before adding duplicates.
- If a list is empty, check Member identity, active Organization scenario, selected Group/Cycle and report filters first. Do not alter permissions or financial rules to make data appear.
- If a case was accidentally resolved, use a fresh scenario or refresh and prepare again. Rehearse mutations before presenting; use inspection for the main demonstration.
- Keep a short-path fallback ready. If setup/discovery would consume too much time, move directly to the prepared established Member and financial story, explaining that it is a seeded example.

## 10. Practical FAQ

**Does TCS hold Members' money?** No. TCS coordinates and records thrift activity; it is not a bank, wallet or custodian.

**Who pays Members?** Under the MVP model, the Organization is responsible for manual payouts. TCS records transfer evidence and the Member's response.

**How are contributions tracked?** The prototype models provider-driven payment confirmation, allocation against obligations and separate settlement/reconciliation states. This demonstration uses simulated events.

**What happens when someone defaults?** The applicable rules and recorded facts determine the case. Outstanding principal, penalties and Recovery remain visible; a post-payout default is not simply an ordinary late contribution. Restrictions and clearance follow the existing workflows.

**Can a Member participate across Organizations?** The Member identity is separate from an Organization workspace. Participation is subject to each Group's eligibility, membership and agreed rules; this is not an unrestricted admission promise.

**How are payouts handled?** Agreed Positions establish order. The Organization makes the external transfer, records it and tracks receipt or dispute. A transfer record alone is not confirmed receipt.

**Which payment provider will be used?** The current direction includes live Paystack/provider integration in the production build. This prototype is not connected to live settlement.

**Are reminders being sent?** Do not claim live delivery. Email, SMS and WhatsApp are planned production channels; present current interface records as prototype behaviour.

**Is this live or production-ready?** It is a validated prototype using in-memory state and simulated infrastructure, not a live-money service.

**What remains before launch?** Production payment/KYC/notification connections, persistent storage, scheduling, deployed security infrastructure and the associated production validation and operational readiness work. Stage 7 neither performs that work nor declares launch approval.

## 11. Stage 7 validation record

The following scoped checks passed against the current working tree. No application code or business rules were changed for Stage 7.

| Check | Result |
| --- | --- |
| `node scripts/check-auth-onboarding-render.mjs` | 239 checks passed, including compact demo groups and entry structure. |
| `node scripts/check-member-experience-render.mjs` | 706 Member screen/persona and responsive structural checks passed. |
| `node scripts/check-owner-experience-render.mjs` | 660 Organization route/scenario and responsive structural checks passed. |
| `node scripts/check-operations-render.mjs` | 53 Operations overview, queue, detail, source and entry checks passed. |
| `node scripts/check-internal-experience-render.mjs` | 381 Internal route/persona and responsive structural checks passed. |
| `node scripts/check-reports-render.mjs` | 334 report, source-scenario and authorization checks passed. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| `node node_modules/vite/bin/vite.js build` | Passed. |

Total: **2,373 render/structural checks**. These exercise server rendering, source contracts and relevant permissions; they do not establish browser geometry, interactive navigation or a timed presenter rehearsal. The in-app browser was unavailable in this environment, so interactive presentation approval remains unverified. Rehearse the checklist in the intended browser before presenting.

No code-level blocker was found in these checks. Practical limitations remain the documented independent discovery example, historical dashboard summaries, repeated base names for payout fixtures and future scenario dates. The guide uses explicit handoffs and Group/Cycle selection to keep the story accurate. No commits, pushes, PRs, production integrations or Stage 8 work are part of this stage.
