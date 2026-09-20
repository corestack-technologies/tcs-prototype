# TCS v1 Frontend Production Strategy

Production handoff for frozen TCS Prototype v1. No production implementation is performed in Stage 8.

The React/Vite/TypeScript/Tailwind application is a candidate foundation for the production frontend. Preserve validated UX and replace prototype services progressively, vertical slice by vertical slice. No rewrite is justified merely because the source began as a prototype.

| Likely reusable | Relevant source / production treatment |
| --- | --- |
| Shared components, tokens and formatting | src/design/foundation.tsx, tokens/date/money helpers, src/components/ui.tsx; preserve semantic statuses, precise money/date display and accessible dialogs |
| Auth and workspace layouts | src/auth, ClientShell, OwnerShell, InternalNavigation; connect real identity without expanding developer controls into public UX |
| Responsive structure | member/owner/internal CSS and shared navigation; retain mobile stacking/contained tables, then verify real devices |
| Domain screen composition | src/App.tsx View map and workspace modules; introduce durable URLs, route parameters and authenticated restoration without losing existing journeys |
| Reports and exports | Catalogue-driven columns/filters/detail; query backend projections with fresh authorization; retain unavailable-data and CSV safety handling |
| Route-level code splitting | src/design/lazyRoute.ts and deferred workspaces; preserve verified dependency boundaries |

## Replace or remove from production

In-memory providers/stores, mutable fixture worlds, demo personas and any-password login, sample OTPs, simulated sessions/locks, scenario clocks, local fake account resolution/provider events and historical dashboard fixtures are prototype-only. Real auth/session state, database persistence and server-side authorization replace them. Never expose provider credentials or financial mutation authority through frontend code.

## Connection contract

For each slice, replace service entry points with typed backend requests and explicit identity/tenant/source versions. Keep loading, empty, unavailable, network failure, forbidden and stale-conflict states distinct. Disable duplicate submission while preserving idempotent server handling. Revalidate after writes and session/role changes; clear scoped caches when actor or tenant changes. Upload evidence to private storage through authorized backend-issued operations. Connect notifications/payment providers through backend adapters only.

Legacy discovery/join screens must connect to shared recruitment in production; seeded dashboard summaries must become authorized source aggregates. Refresh must restore the correct authenticated URL/context rather than reset the product. Full route/action authorization belongs on the server even where prototype guards are currently local or implicit.

Preserve the six-width structural contract and conduct real-browser/device, keyboard, screen-reader and network-condition UAT. Structural SSR checks are not visual approval. See U26.

