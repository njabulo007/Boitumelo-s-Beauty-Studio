# Firebase handover — not deployed

The functioning UI uses an explicit local demo. Setting `VITE_DATA_MODE` to anything other than `demo` shows a configuration screen: **live mode is gated**, never a silent fallback. The Firebase adapter and reference trusted functions are prepared separately, but require the integration and emulator/security validation below before real data is used.

## Ownership and configuration

1. Boitumelo creates and owns the Firebase project under her own Google account. She grants Khulisa Media developer access with the least privileges required. No project, billing or cloud resources were created by this task.
2. Choose the appropriate project region, data retention and consent policy with the owner. The reference callable code uses `europe-west1`; change both client and server together if another supported region is chosen. Review POPIA requirements for real customer information.
3. Enable email/password Firebase Authentication and configure authorised application domains and password reset templates. Confirm Firestore and Storage region and any plan/billing requirements independently; do not enable billing automatically.
4. Copy `.env.example` to `.env.local` and enter Firebase **web** configuration. These identifiers are public configuration, not privileged secrets. Never add a service account or Admin SDK key to frontend variables, browser storage, this repository or chat. Configure App Check for the web app and emulator debug handling; trusted functions enforce App Check.
5. A trusted operator provisions the owner's `admin: true` custom claim with the Admin SDK in a secure server/admin environment. Verify the UID out of band. Registration/profile writes can never set roles. Refresh the owner's ID token after provisioning. Never use frontend code to grant admin privileges.

## Prepared boundaries

- `src/services/firebase.ts`: explicit configuration validation, registration/login/logout/password reset, self-profile read/edit, public content queries, customer-filtered visit/reward queries, admin content writes and image upload progress, trusted visit/redemption/correction callable clients, anonymous measurement callable.
- `firestore.rules`: customers can read/edit only their own minimal profile and read their own visits/rewards. Customers cannot write visits, balances, redemptions or audit. Admins manage public content. All other access is denied. No profile field can grant privileges.
- `storage.rules`: gallery images are public; only an authenticated administrator can upload/replace/delete. Size and content type are enforced. MIME metadata checks do not prove safe image bytes; use a trusted media processing path before untrusted uploads are allowed.
- `firebase/functions/src/index.ts`: reference callable operations check the trusted admin claim, validate identifiers, use Firestore transactions and persistent operation IDs, update balances, preserve correction reasons and write audit entries atomically. No operation credentials are exposed to the client. Content audit uses backend auth-context triggers. A strict measurement schema omits user identifiers from stored events.

## Work required before activating live mode

1. Connect the UI state/service interface to the Firebase adapter using `onAuthStateChanged` and verified claims, real loading/error states, subscriptions or refresh after mutations, and server timestamps. Do **not** simply remove the live-mode guard. The local demo state is deliberately a different store and must not be imported or migrated into live profiles automatically.
2. Convert Firestore timestamps to ISO strings at the content/history read boundary. `saveContent` converts promotion dates from ISO strings to Firestore Timestamps; reads intentionally return raw documents pending final live view models. Sort public content by its `order` field, apply active date filtering in the same shared model and retain supported image origins.
3. Connect admin customer list/audit/analytics queries and shared category settings. The demo supports custom category names; current reference rules allow Nails/Hair/Beauty only. Add a reviewed admin-managed category collection/settings document, validate membership in rules, and audit changes before custom categories are used live.
4. Implement complete live gallery lifecycle (upload compressed blobs, content metadata, safe replacement, reference checks before removal, cleanup of abandoned uploads). The upload adapter alone does not manage metadata or cross-service atomicity. Production storage quota and file processing differ from local demo storage.
5. Confirm the loyalty policy and versioning with Boitumelo. The reference server has an explicitly sample five-visit policy. Keep historical grants valid if the policy changes. Provide the owner a reviewed resolution process for corrections involving already redeemed rewards.
6. Review promotion validation when the underlying regular price/category changes; either require active offer prices to stay lower or end incompatible offers. Decide how to publish only approved content. Audit function invocations and protect operation/audit retention.
7. Add App Check, abuse/rate limiting and a reviewed analytics retention/aggregation process. App Check does not eliminate analytics abuse. The reference callable does not store auth UID or profile information in analytics, but platform request logs have separate retention/access requirements.
8. Review profile creation recovery if Auth signup succeeds and the Firestore write fails. Add account deletion/export, appropriate email verification, privacy notice and opt-in handling; marketing consent is independent of registration. Never expose all customer profiles in public content.

## Local validation before any deployment

Use Node 22 for functions and an appropriate Java runtime for the Firestore emulator. Install Firebase CLI in an approved development environment. Emulator connections must be explicit and development-only (`connectAuthEmulator`, `connectFirestoreEmulator`, `connectStorageEmulator`, `connectFunctionsEmulator`). Never use emulator admin credentials against production.

Type-check reference functions:

```sh
npm --prefix firebase/functions ci
npm --prefix firebase/functions run build
```

Before deploying, run a Firebase Emulator Suite and add/execute rules-unit tests for:

- Anonymous public content reads; draft and archived content query restrictions.
- Customer A being denied Customer B's profile/visits/rewards.
- Anonymous/customer denial of content, visit, balance, role and audit writes.
- Self-registration rejecting role fields and enforcing a server creation timestamp.
- Valid admin content mutations; invalid prices/dates/types; Storage upload type/size constraints.
- Concurrent requests using one operation ID creating exactly one visit/redemption and one audit entry.
- One reward not being redeemed twice with different operation IDs under concurrency.
- Corrected visits and redeemed-reward protections; denied requests changing no data.
- Auth token refresh, reset email delivery and App Check enforcement.

No Firebase emulators, rules enforcement, real Auth email delivery or deployed callable behaviour were verified in this task. Local domain and browser tests validate the demo; the trusted functions were type-checked. Only after owner review and successful emulator/security testing should a separately authorised deployment activate rules/functions/storage. This task does not deploy or enable billing.
