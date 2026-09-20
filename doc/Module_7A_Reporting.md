# Module 7A — reporting foundation

Reports are read-only projections of the shared in-memory domain records. No report fixtures are loaded into a separate production data store. The pure generator is `src/reports/service.ts`; definitions and export metadata are in `src/reports/catalogue.ts` and `model.ts`.

## Entry points and scope

- Member navigation → Reports, or `/reports/member`: Contributions, Obligations, Payouts, Participation.
- Organization navigation → Reports, or `/reports/organization`: Groups & Cycles, Collections, Payment Register, Round Collection Summary, Outstanding & Aging, Payouts, Defaults & Recovery, Exit Settlements, Organization Fees, TCS Revenue Share.
- Anonymous routes require sign-in. Owner generation requires the authenticated Member to own the selected approved/historical workspace. Internal identity does not confer Member or Owner report access.
- The bound service reads current Member identity at invocation, including after logout. Report filters cannot expand visibility. Source reviews, internal comments, reviewer identity and bank accounts are excluded by projection.

## Financial interpretation

- All money is integer kobo; display formatting alone converts to NGN. Filtered summary values are sums of the displayed report rows. Null means unavailable/under review, not a confirmed zero; reports disclose incomplete totals.
- Collections use one generated Member/Round obligation per row, including its Position components. Payment Register uses one transaction/manual record per row; unconfirmed attempts contribute zero to money totals. These different report grains must not be added together.
- Optional skipped contributions are not required debt. Advance reservations do not generate obligations or count as recognized collection. Manual review and payment exceptions retain their allocation state.
- Payout transfer, evidenced receipt, window completion and unconfirmed transfer are distinct. The source payout balance is explained in row details; an undisputed recorded transfer awaiting confirmation is not labeled evidenced receipt. Scheduled rows are projections, not payment execution. Final Operations evidence controls disputed receipt and proportional recognition; it never invents Member confirmation.
- Original fee recognition and revenue postings remain visible. Financial adjustment requirements are displayed separately and do not execute credits, refunds or external movement.
- Recovery reuses `recoveryBalances`: principal first, then penalty, with separate audited waivers and excess recovery exceptions. Original aggregate totals and historical defaults remain intact.
- Exit settlements remain Organization liabilities, separate from Member defaults. Legacy resolved status is explicitly distinguished from individual settlement confirmation records.
- Force Close absorption is shown as proposed historical context; no allocation/write-off is inferred.

## Approved Recovery allocation and aging

`src/reports/recoveryAllocation.ts` derives allocation from the original aggregate recovered value. It applies money to outstanding required principal ordered by original due date, then Round number, then source ID. After all applicable principal is cleared, remaining money applies to valid accrued penalties in the same order. Skipped optional contributions and ungenerated obligations are excluded. Money never crosses the Member, Organization, Group/Cycle or Recovery-case boundary.

Aging exposes Original Principal, ordinary satisfied principal, Recovery Applied, Net Principal Outstanding, Penalty Outstanding, Penalty Recovery Applied, Original Due Date and aging/default state. Fully recovered rows remain as `CLEARED BY RECOVERY` and contribute zero to current outstanding. Partial recovery does not reset aging. Allocation happens before filtering so changing a filter cannot redirect recovered money. Round and Cycle outstanding summaries use the same derived principal allocations. Recorded collection/payout execution and case resolution flows remain unchanged.

Legacy penalty data is one case-level aggregate without a recorded due date. It remains a separately identified penalty row rather than an invented per-Round charge; no penalty due date or numeric age is fabricated. When dated penalty source records exist, they are ordered by their original due date, Round order and source ID. Validated penalty waivers remain separate from recovered payment amounts.

Optional explicit obligation links support disjoint Recovery cases within a Cycle. Overlapping case scope, foreign links, duplicate sources or source amounts that do not reconcile to the case are reported as allocation exceptions; no money is silently spread between cases. Overpayment remains a Recovery Payment Exception, with nonnegative balances and the original recovered aggregate retained. These projections create no payment transactions and never rewrite obligations, original dates, historical amounts or case status.

**Production handoff:** persist explicit immutable Recovery allocation events, including Recovery/payment ID, Organization, Member, Group/Cycle, liability source ID, principal/penalty component, amount, original due date, effective allocation timestamp, actor/rule version and reversals. Production must not depend solely on re-deriving historical allocations from changing aggregate balances. The legacy projection is deterministic reporting support, not a replacement for that allocation ledger.

## Demonstration

Sign in as the existing verified Member, choose the active Organization scenario, and load scenarios using the existing Group, Payment, Payout, Lifecycle or Reconciliation workspaces. Reports immediately derive from those same records. Return to the Member workspace to inspect only that Member's records. Existing Operations evidence decisions and later financial reviews also appear in the corresponding reports without rebuilding fixtures.

Useful scenarios include half/multiple Positions, optional skip, advance held/released, manual pending/reviewed, partial payout, Member confirmation, confirmation-window completion, final partial/no/full evidenced receipt, Post-Payout Default, partial/cleared Recovery, Exit Settlement, completed and force-closed Cycles, and TCS share awaiting/confirmed receipt.

## Validation commands and limits

Final validation after Recovery regularization passed:

- 353 domain tests: 100 reporting tests plus 253 Modules 1–6 regressions. The reporting suite was rerun after adding final duplicate-row/allocation assertions; all 100 passed.
- 334 reporting render/route/service checks, including explicit completed, cancelled and force-closed history, plus 678 existing workspace/route render checks (1,012 total).
- Filtered totals equal underlying rows. Cleared Recovery rows remain visible with zero current outstanding; partial Recovery preserves original due-date aging. Repeated generation produces no duplicate allocations or report rows.
- Member and Organization isolation, payout evidence, Organization Fee and TCS Revenue Share regressions passed. Original aggregate Recovery and payment/source history remain unchanged.
- Scoped reporting/Modules 1–6 typecheck passed. Production build passed with the existing bundle-size advisory.
- Localhost port 8443 returned HTTP 200 for `/reports/member`, `/reports/organization` and the Recovery allocation module.

The Recovery-linked aging question is resolved by the approved rule above. There is no remaining Module 7A product question. Final validation required only additional assertions and these notes; Reporting was not rebuilt or restarted.

- `npm run test:reports`: report calculations and isolation using existing shared domain scenario builders.
- `npm run test:reports:render`: catalogue/detail/empty/error/source scenario renders, route guards and bound-service authorization, including retained callable after logout.
- `npm run typecheck:reports`: changed reporting modules, shared integrations and Modules 1–6.
- Existing domain test files and all existing render scripts remain regression checks.
- `npm run build`; HTTP checks for both report routes and transformed source modules on localhost port 8443.

Full typecheck has six pre-existing TS6133 diagnostics, outside this work: `Badge` in OrgApplicationQueue, `empty` in OwnerPayouts, `communityId` in CommunityDetail, `Button` in DiscoverCommunities, `isPast` in GroupTimeline, and `communityId` in JoinRequestSubmitted. Those files were not changed. Production build retains the large-bundle advisory. Browser discovery was unavailable in this environment, so visual screenshots and interactive browser checks are not claimed; render validation uses React server rendering.

No Module 7B, Settings, backend, elaborate exports, commits, pushes or PRs are included.
