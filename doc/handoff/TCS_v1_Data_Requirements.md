# TCS v1 Production Data Requirements

TCS Prototype v1 production handoff. Requirements describe the approved build contract, not infrastructure already delivered.

## Persistence contract

Persist tenant/Member/source identities, accepted terms and immutable histories independently of display names. Financial money uses integer kobo with explicit NGN currency and bounded arithmetic. Do not infer currency or amount scale from a field name alone: the prototype Group draft uses naira, while ledger records use minor units.

| Source / current derivation | Production persistence required | Integrity rule |
| --- | --- | --- |
| Group/Cycle drafts and readiness | Versioned draft, explicit commitments, activation snapshot, effective amendment history | Atomic activation; stale acceptance cannot satisfy readiness; old Cycle never overwritten |
| Round generation | Schedule/timezone, generated Round/obligation/component IDs and original due dates | Unique generation keys; retain catch-up source dates; no future obligation fabricated for advance |
| Provider facts and payment allocation | Raw verified-event reference/hash, trusted success time, arrival time, effective allocation time and explicit allocation records | Deduplicate provider reference; tenant/amount conflict visible; consumption bounded by recognized receipt |
| Advance transaction hold | Explicit reservation target, state and release allocation | Release once on eligible opening; conflicting/unusable money remains exception |
| Penalty day ledger | Component/day charge, principal basis, rate, rounded amount, business/actual timestamps | Immutable charges; future bases use dated recognized payments; no compounding or backdated invention |
| Recovery aggregate projection | Explicit receipt and per-obligation/per-penalty allocations, application dates and excess exception | Principal first oldest due then penalty; receipt never reallocated to later-created debt; no double counting linked penalties |
| Historical default projection | Immutable qualification event with payout-receipt reference, threshold and linked debt scope | Clearance never erases default; new disjoint scope does not reuse settled debt |
| Payout calculation / fee recognition | Versioned instruction and bank snapshot, installment, evidence, receipt outcome, fee/share posting | Original recognition retained; later outcome creates explicit adjustment requirement/controlled adjustment, never silent overwrite |
| Settlement and TCS receivables | Provider settlement/match facts, receiving account snapshot, unique transfer reference and TCS confirmation | Owner declaration not receipt; bank fees do not reduce amount due; mismatches not auto-settled |
| Operations projected cases | Stable source-case identity, durable assignment/notes, source decision and authority snapshot | Queue projection may be rebuilt; decisions must be durable and transactional with source change |
| Settings and run state | Immutable config revisions, actual change time, effective Business Date, run/step/retry records | Protected-history rewind guards; retry lineage; source and configuration version checks |
| Evidence files | Private object reference, content metadata/hash/version, authorized access and retention classification | Never persist temporary browser File handles or expose public KYC links |

## Audit and corrections

Audit records answer actor, action, target, time, reason, prior/new state and authority. Preserve actual wall-clock time separately from business-effective time and provider success time. Financial adjustments link to the original posting and approval; ordinary editing must not rewrite ledger history. Protect audit retention and backup/restore consistency; retention periods and lawful erasure exceptions require approved production policy, not invented numbers.

## Prototype migration boundary

Seeded historical dashboards, aggregate-only Recovery samples and received-demo facts lack complete dated evidence. They are test fixtures, not production migration records. Positive-rate catch-up must fail visibly when dates needed for a valid principal basis are missing. No invented receipt history is an acceptable migration strategy. Production starts with explicitly approved data/import provenance.

