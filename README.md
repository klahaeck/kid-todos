# StarrySteps

Family routine management built with Next.js, Clerk, MongoDB, and Convex.

## Local development

Use Node.js 24.15 or newer in the 24 LTS series. Install with `npm ci`, copy
`env.example` to `.env.local`, and configure Clerk, MongoDB, and Convex.
Run `npm run convex:dev` and `npm run dev` in separate terminals.

MongoDB must support transactions (Atlas or a replica set). Household membership,
invitation redemption, and child creation share transaction locks to enforce
membership limits and prevent nested households. A standalone MongoDB server
does not support these operations.

Set the same `CONVEX_SERVER_SECRET` in the web app and Convex deployment. Missing
configuration or synchronization failures return an error instead of reporting
successful household changes.

Configure `CLERK_JWT_ISSUER_DOMAIN` in Convex and create Clerk's `convex` JWT
template so authenticated browser mutations can run.

## Validation

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Tests use `convex-test` for actual Convex functions, a transaction fixture for
Mongo repository logic, and jsdom for parent-facing task editing. They do not
contact Clerk, MongoDB, or a deployed Convex instance. The transaction fixture
verifies application invariants; production Mongo transaction behavior still
requires a replica set. The production build needs the app's configured
environment and network access for Google Fonts.

## Household access and deletion

Mongo household revisions order complete access snapshots in Convex. Convex
rejects stale or repeated revisions. Removed members remain as pending rows in
Mongo until synchronization succeeds; retry the remove/leave action or load the
primary's household settings to finish an interrupted removal. Conditional
finalization preserves later memberships. A redeemed invite can also be retried
if its Convex synchronization failed.

Child deletion records a Convex tombstone and removes tasks and completions in
indexed batches. The Mongo child remains available for retries until Convex and
legacy Mongo history cleanup finish. Retry deletion after an interrupted cleanup
or the "still in progress" message. Tombstones prevent concurrent clients from
creating tasks or completions for a deleted child.

Household members use the primary's entitlement snapshot for at most one minute.
Expired snapshots refresh from Clerk, and refresh errors do not extend expired
paid access. Existing admin/friend role grants are preserved.

## Deployment

Deploy the Convex schema/functions and web app as a coordinated release: the new
versioned household synchronization and child deletion API must match their web
callers. Prevent household changes during the cutover from the previous API.
The new `householdSyncState` and `deletedChildren` tables are additive; existing
records need no backfill. Mongo creates household revision documents lazily.
Run the validation commands above before deployment.
