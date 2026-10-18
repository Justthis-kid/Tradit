# Tradits Trade-In & Resale Platform
## Technical Requirements, Data Model, and Backend Architecture

**Status:** Architecture proposal; legal and jurisdictional review required before launch
**Scope:** U.S. consumer trade-ins and resale of pre-owned footwear
**Application baseline:** Next.js App Router / Vercel, PostgreSQL, private object storage, external KYC and payment providers

> **Important limitation.** No technical design can guarantee protection from lawsuits, FTC action, counterfeit liability, or secondhand-dealer penalties. These obligations depend on operating locations, transaction facts, contracts, representations, and changing state, county, and municipal laws. This document specifies controls that support compliance; it is not a legal opinion or a substitute for counsel. Obtain written review from consumer-protection, privacy, payments, intellectual-property, and secondhand-dealer counsel in every operating/acquisition jurisdiction before accepting goods or issuing value.

## 1. Architecture decisions and non-negotiable boundaries

1. **Use PostgreSQL as the system of record.** Use typed migrations and foreign keys. Separate ordinary commerce data from restricted identity data using distinct database roles and schemas; use separate databases/accounts if the threat model or KYC provider requires stronger isolation. MongoDB is not selected for this design.
2. **Do not collect government-ID images in Tradits.** Use a vetted KYC provider's hosted capture/verification flow. Store only its opaque subject/reference, decision, timestamps, jurisdiction, and minimum legally required audit evidence. If a jurisdiction actually requires a dealer to retain an ID record, get counsel's written retention/access specification and store that record in a separately administered restricted system—not the product application or its logs.
3. **Treat every image as untrusted.** Direct browser uploads go only to a private quarantine bucket. Never make the uploaded object publicly readable. Decode and re-encode the image in an isolated worker, remove metadata, scan it, and publish only a sanitized derivative to the private evidence bucket.
4. **A photo estimate is not an approved payout or authentication.** It is a conditional, expiring offer based on seller-provided data. Only documented physical inspection and authentication may advance an item to payout approval or resale inventory.
5. **No automatic private “forfeiture.”** A suspected counterfeit enters restricted evidence custody and a legal-review hold. Only a documented, jurisdiction-specific legal basis and authorized decision can determine retention, surrender, return, or destruction. A policy checkbox does not create governmental forfeiture authority.
6. **Keep payment-card data out of Tradits systems.** Use provider-hosted payment fields/redirect flows and persist only provider tokens/references and reconciliation metadata.
7. **A configurable holding-period timer is a safeguard, not a universal legal rule.** Apply the actual rule for the acquisition jurisdiction, dealer-license type, product class, report filing, police hold, and release conditions. Do not allow an operator to set a shorter period than the legally reviewed rule.
8. **Build jurisdiction gates before launch.** A transaction cannot proceed unless the acquisition, seller, shipping origin/destination, and sale locations resolve to an approved, current compliance rule set.

## 2. System architecture

```text
Browser (keyboard/screen-reader accessible)
  ├─ Authenticated account + CSRF-protected app requests
  ├─ Shoe photos ──> upload-intent API (auth, ownership, quotas, MIME/size)
  │                    └─ short-lived signed PUT to private QUARANTINE bucket
  │                         └─ queue/event (no public URL)
  │                              └─ isolated image worker
  │                                   ├─ magic-byte/type validation, dimensions/pixel cap
  │                                   ├─ malware scan, EXIF/GPS strip, decode/re-encode
  │                                   ├─ reject/record failure; expire raw quarantine object
  │                                   └─ sanitized private evidence object
  │                                        └─ metadata-only evaluation job
  │                                             └─ approved AI processor (no identity payload)
  ├─ Conditional offer / trade-in API
  │    └─ jurisdiction + KYC + velocity/risk + state-machine guards
  └─ Checkout
       └─ server price/tax quote ──> tax engine (destination address)
       └─ hosted PSP fields/redirect ──> processor tokenization
            └─ signed webhook ──> idempotent payment/order/ledger transaction

Vercel Next.js services (stateless; secrets in encrypted environment)
  ├─ PostgreSQL (commerce, workflow, immutable events; least-privilege roles/RLS)
  ├─ Restricted identity provider/store (KYC vendor hosted flow; no ID in app DB)
  ├─ Private object store + KMS (quarantine/evidence, separate IAM policies)
  ├─ Queue + isolated workers (image sanitize, malware scan, retention, notifications)
  ├─ KYC provider (hosted ID verification; opaque references only)
  ├─ Carrier / dealer-reporting integrations (verified jurisdiction rules)
  ├─ Tax engine (nexus + destination sourcing + immutable quote/transaction result)
  ├─ Payment processor (hosted/tokenized card entry; no PAN/CVV in Tradits)
  └─ Append-only audit/security monitoring (no secrets, raw IDs, image bytes, or PAN)
```

### Trust zones

| Zone | Contains | Access boundary |
|---|---|---|
| Public application | Catalog, public product descriptions, non-sensitive pages | No direct access to private object storage or PII |
| Commerce database | User UUIDs, trade-in states, inventory, orders, ledger references | App role has only required operations; RLS and ownership checks |
| PII/KYC boundary | KYC vendor reference and minimized verification result; exceptional legally required records | Separate role/account; security/compliance personnel by explicit grant; every read audited |
| Quarantine storage | Untrusted original upload pending scan/normalization | Worker-only read; no CDN/public access; short lifecycle |
| Evidence storage | Sanitized images, inspection/counterfeit evidence | Private, encrypted, scoped signed reads; retention/legal hold |
| Payment provider | PAN, CVV, payment credentials | Provider only; never proxy or log sensitive authentication data |
| Audit boundary | Actor, action, object UUID, reason, timestamp, correlation ID | Append-only; separate write/read roles; retention schedule |

## 3. Data privacy, account security, and user-generated content

### 3.1 Data classification and isolation

Classify and inventory fields before implementation:

- **Public:** published product facts approved for listing; no seller identity or shipment label.
- **Internal commerce:** opaque user UUID, offer amount, inventory, order state, tax result, PSP/KYC references.
- **Restricted personal data:** legal name, address, email/phone, date of birth, tax identifiers, KYC decision details, dealer report, payout destination reference.
- **Highly restricted evidence:** ID evidence retained under an applicable legal obligation, shoe serial/production number where it may support an investigation, counterfeit evidence, law-enforcement requests.
- **Prohibited in Tradits application:** PAN/CVV, plaintext passwords, raw KYC documents by default, public image URLs, full government ID numbers in logs, unredacted webhook secrets.

Store a random UUID as the user-facing primary identifier. Keep PII in a dedicated `identity` schema (or separate service/database) linked by that UUID. Do not place email, name, address, ID number, KYC response payload, or PII-bearing claims in analytics events, URLs, client-side bundles, JWTs, object keys, filenames, exception messages, or support tooling.

PostgreSQL/Supabase guidance:

- Enable TLS for every client and connection pool; require verified certificates where supported.
- Use managed disk encryption at rest (AES-256 where the service offers it) and KMS-managed keys. Database/storage encryption at rest does **not** replace application access control or field-level protection.
- Encrypt high-risk PII fields at the application boundary using envelope encryption: AES-256-GCM data-encryption keys protected by a KMS key. Persist ciphertext, nonce, authentication tag, key version, and minimal lookup HMAC where needed. Never reuse a nonce with a key. Support key rotation and re-encryption; do not log decrypted values.
- Prefer tokenized vendor references over storing bank account, payout, or KYC data.
- Create separate roles for migrations, web/API, read-only support, compliance casework, and audit. Runtime roles must not own tables or bypass RLS. Admin-console access uses MFA and just-in-time grants.
- Enable row-level security as defense in depth. Every route also performs server-side authorization and tenant/owner checks; RLS is not a substitute for them.
- Backups and replicas inherit the classification and retention of source data. Encrypt, restrict, and expire them; include restore tests and key recovery procedures.
- Use append-only audit events for changes to identity access, case decisions, hold overrides, ledger entries, listings, and deletion exceptions.

### 3.2 Authentication, sessions, and endpoint abuse controls

- Passwords: Argon2id with parameters benchmarked to the production runtime and current OWASP Password Storage guidance; store only the encoded hash and parameters. Use a unique salt through the library. Rehash on successful login when parameters change. Never email or log passwords.
- Prefer passkeys or a managed identity provider for account recovery and MFA. Require phishing-resistant MFA for privileged staff; offer MFA to sellers. Recovery must revoke sessions and notify the account's established channel.
- Session cookies: opaque, cryptographically random, rotated at authentication/privilege change, stored server-side only as a hash. Set `HttpOnly`, `Secure`, `Path=/`, and `SameSite=Strict` for same-site application flows. If an external identity/OAuth callback requires cross-site navigation, use a short-lived, one-time `SameSite=Lax` state/nonce callback cookie rather than weakening the main session. Never put bearer session tokens in `localStorage`, query strings, or analytics.
- Set bounded idle and absolute session lifetimes; rotate after login, password change, recovery, KYC privilege change, and suspected compromise. Revoke all sessions on deletion/credential reset.
- Apply IP + account + device-aware rate limits to login, recovery, registration, upload intents, valuation requests, KYC initiation, payout changes, and checkout. Use a shared distributed limiter (not process memory on serverless). Add progressive delay and abuse telemetry; avoid permanent account lockout that enables denial of service. Return generic authentication errors.
- Require CSRF tokens or a robust same-origin custom-header design for state-changing cookie-authenticated endpoints; validate `Origin`/`Host`; configure strict CORS. SameSite is defense-in-depth, not CSRF protection by itself.
- Validate request bodies with schemas, impose byte/image/pixel limits before parsing, use parameterized SQL/ORM, set request and provider timeouts, and return non-sensitive error codes. Do not broadly swallow exceptions.
- Protect secrets with Vercel encrypted environment variables or an external secret manager. Separate Preview and Production secrets; never use production PII/payment/KYC credentials in previews.
- Add security headers (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame restrictions), dependency scanning, secret scanning, and audited deployment approval.

### 3.3 Private photo pipeline and metadata removal

**Recommended flow:** the client asks the API for an upload intent; the API validates the authenticated seller, transaction ownership, rate, allowed media type, and byte limit, then creates a random object key and a narrowly scoped signed PUT that expires in minutes. The signed URL is only for one key and one method; it is not a read URL. A direct signed upload necessarily lands first in quarantine. The quarantine object is private, isolated, encrypted, non-indexed, and inaccessible to the public/CDN.

1. Accept a narrow allowlist (JPEG, PNG, WebP; reject SVG and animated formats unless explicitly supported). Check file signature/magic bytes, declared MIME, maximum byte size, maximum dimensions and total decoded pixels; do not trust filename or browser MIME.
2. Upload only to a dedicated quarantine bucket/account prefix with no public ACL, no website hosting, and no cross-account read. Signed URL expires quickly and is bound to a generated object key and expected content length/checksum where supported.
3. Emit an object-created event to a queue. Worker runs with no general database or KYC permissions. It downloads only the exact quarantined key; uses patched image libraries; scans for malware; decodes and re-encodes to a canonical raster format; strips EXIF, GPS, XMP, IPTC, comments, thumbnails, and embedded profiles not required for color fidelity; normalizes orientation; rejects malformed/decompression-bomb images.
4. Store only the sanitized derivative in a separate private evidence bucket. Record a SHA-256 content hash, media type, dimensions, transform version, and object key; keep no original filename as an object key. Do not put seller ID or email in the key.
5. Delete the original quarantine object after successful transform or a short maximum TTL. On failure, quarantine and delete under an incident policy; surface a user-safe failure without echoing internal paths.
6. Generate short-lived signed GET URLs only after server-side ownership/role authorization. Never persist public URLs or send private image URLs to an unapproved AI vendor.
7. If a third-party model provider processes an image, perform vendor privacy/security review, contract/DPA review, retention/training opt-out review, and data-region review. Send the minimum sanitized shoe image, never ID, name, address, or account token. Record processor/version and purpose.
8. Government-ID capture must use the KYC provider's hosted SDK/page. If a law requires Tradits to retain an ID copy, route through a distinct restricted intake, scan/sanitize safely, encrypt separately, and apply an approved retention/legal-hold schedule.

### 3.4 Deletion and retention (privacy requests)

Implement a verified, idempotent deletion workflow—not a single SQL delete:

1. Authenticate/verify the requester using a non-compromised channel; acknowledge the request and create a deletion case with due date based on applicable law.
2. Immediately revoke sessions, refresh tokens, signed upload links, API tokens, and saved payout/payment methods. Stop marketing and nonessential processing.
3. Delete or irreversibly anonymize account profile, saved addresses, wishlist, unneeded photos/derived assets, support data, analytics identifiers, and vendor references when the processor supports it. Send deletion instructions to subprocessors.
4. Preserve only fields counsel identifies as necessary for tax, payment disputes, dealer reports, anti-fraud, litigation hold, or unclaimed-property obligations. Place preserved records in restricted, purpose-limited storage with a legal basis, expiration/review date, and access log; remove direct identifiers where lawful.
5. Delete object versions, thumbnails, derived images, CDN caches, replicas, and search indexes. Configure backup expiration and document that backup copies become inaccessible/expire on a defined schedule. Do not claim immediate erasure from immutable backups unless actually true.
6. Write a minimal deletion receipt (request UUID, completion status, exception category, timestamps) without retaining deleted PII. Verify via automated reconciliation and report completion/exception to the user as required.

Define per-record retention classes and data owners before production. Retention schedule must cover raw uploads, sanitized shoe photos, KYC references/evidence, dealer reports, transaction/tax records, payout records, authentication evidence, audit events, support messages, and backups. Legal holds suspend deletion only for scoped evidence and are reviewed on a schedule; they do not justify retaining an entire user account indefinitely.

## 4. Secondhand dealer, KYC, and fraud tracking

### 4.1 Jurisdiction rule registry

Create a versioned, counsel-approved rules registry keyed by acquisition state/county/city and dealer/business type. Store:

- required license/registration and permitted locations;
- seller age/identity and threshold requirements;
- required report fields, transmission endpoint, deadline, and response receipt;
- acquisition date/time definition, mandatory holding period, weekends/holidays rules, police hold, and release conditions;
- whether the rule applies to footwear, online transactions, mail-in acquisitions, or specific item/value classes;
- record-retention duration, inspection rights, and privacy safeguards;
- approved legal citation, counsel approval reference, effective dates, and next review date.

No seller or item is eligible for shipment acceptance/acquisition unless the address and item facts resolve to an active approved rule set. Unknown jurisdiction or missing rule means **manual compliance review / do not acquire**, not default approval. Keep the policy version on each transaction so historical decisions can be reconstructed.

Do not treat a sample holding period as a nationwide rule. For example, Florida Chapter 538 has registration, reporting, record-retention, and 15- or 30-day holding requirements for covered transactions, but it also contains defined exceptions and excludes “clothing”; whether footwear is covered and whether an online/mail-in exception applies requires jurisdiction-specific legal analysis. Florida also allows more restrictive local ordinances. This example is a rule-registry test case, not a default Tradits policy.

### 4.2 KYC and ID access

- Collect seller identity through a hosted, audited KYC provider. Use step-up verification based on legally reviewed value/volume thresholds, suspicious-activity risk, age, payout rail, jurisdiction, and cumulative transactions—not a single hardcoded dollar threshold.
- Store `provider`, opaque `provider_subject_id`, status, method, verified name-match outcome if necessary, `verified_at`, expiry/recheck time, risk reason code, jurisdiction, and event reference. Do not store raw document numbers or ID photos in the general account database.
- Use a separate compliance service role to access vendor evidence when a legal reporting duty requires it. System administrators, product engineers, support agents, and analytics users receive no ID-document access by default. Enforce two-person approval for exceptional document access and log viewer, purpose, case, timestamp, and export.
- KYC provider access is controlled by SSO/MFA, narrow job function, time-bounded grants, and vendor audit logs. Monitor bulk access and exports; alert on policy violations.
- KYC state must gate seller payout and legally required dealer reporting. Reverification and review outcomes are explicit workflow states, never client-controlled flags.

### 4.3 Local holding period and non-listing gate

Use a server-enforced inventory eligibility function. A shoe is not publicly listable unless all predicates are true:

```text
physical_receipt_confirmed
AND authentication_status = AUTHENTICATED
AND required_dealer_report_status = ACCEPTED (or legally approved alternative)
AND police_hold = false
AND legal_case_hold = false
AND jurisdiction_rule_version is current and approved for this acquisition
AND eligible_at <= authoritative_database_time
AND inventory_status = AVAILABLE
```

`eligible_at` is calculated from the recorded acquisition/receipt/report facts and the applied rule version; it is never a client-submitted date. Record the rule-derived release timestamp, timezone, rule version, report receipt, any police hold start/release authority, manual override actor/reason/second approver, and append-only state history. Changing configuration does not silently release old inventory. A hold extension takes effect immediately; shortening requires compliance approval and documented legal authority. Scheduled jobs can update status, but listing APIs recheck the complete predicate on every publish and purchase path to avoid stale-job races.

Use `NOT LISTABLE` as the default state. Search, feeds, product pages, recommendations, caches, sitemaps, and checkout must filter by the same server-side eligibility predicate. A hidden/unpublished flag alone is insufficient.

### 4.4 Condition grading and identifying marks

Adopt a documented, reproducible grading rubric: overall grade plus separate upper, outsole, midsole, insole, odor/cleanliness, structural integrity, alteration, and completeness fields. Define allowed scale values, observable criteria, photo evidence, grader, grader training/version, inspection timestamp, and review/appeal procedure. Keep seller self-report separate from inspector-verified grade. Every grade revision is versioned with before/after and reason.

Capture manufacturer, model/style/SKU, size/width, colorway, country/plant where visible, production date/lot, tongue-label production/style code, box label, and other unique marks. Distinguish **manufacturer identifier** from a truly unique serial: many shoe production codes identify a model/production run and are not unique per pair. Preserve exact raw observation in restricted evidence; normalized searchable fields are separate. If searches are needed without exposing raw identifiers to ordinary staff, store an HMAC-SHA-256 of normalized identifiers under a KMS-protected key alongside encrypted ciphertext. Do not use plain unsalted hashes for low-entropy production codes.

Law-enforcement searches/requests must use a dedicated verified request workflow. Record requestor/agency, authority/process, scope, verification, legal approval, data disclosed, date, recipient, and response receipt. Return only responsive fields; place legal hold on relevant evidence; do not provide a general searchable PII console.

## 5. Conditional offer, inbound custody, inspection, and counterfeit response

### 5.1 State machine

Persist state transitions in a transaction and append a corresponding immutable event. Reject transitions not in this graph; state is changed only by server-side commands with actor, reason, evidence references, and idempotency key.

```text
PENDING_PHOTOS
  ├─ valid sanitized photos + valuation rules ─> CONDITIONALLY_APPROVED
  ├─ incomplete/unsafe/unsupported photo ──────> NEEDS_MORE_INFO
  └─ seller withdraws before shipment ─────────> WITHDRAWN

CONDITIONALLY_APPROVED
  ├─ seller accepts terms + offer not expired ─> INBOUND_SHIPPED
  ├─ offer expires ─────────────────────────────> OFFER_EXPIRED
  └─ seller declines ───────────────────────────> DECLINED

INBOUND_SHIPPED
  ├─ carrier delivery / signed intake ──────────> RECEIVED
  └─ lost/damaged/exception ────────────────────> SHIPPING_EXCEPTION

RECEIVED
  ├─ jurisdiction intake/report requirements ──> AUTHENTICATING
  ├─ identity/report issue ─────────────────────> COMPLIANCE_HOLD
  └─ item mismatch ─────────────────────────────> REVIEW_REQUIRED

AUTHENTICATING
  ├─ genuine + grade/offer accepted ─────────────> APPR_FOR_PAYOUT
  ├─ genuine but revised offer ─────────────────> REVISED_OFFER_PENDING
  ├─ suspected counterfeit ─────────────────────> SUSPECTED_COUNTERFEIT_REVIEW
  ├─ not counterfeit but unacceptable ──────────> RETURN_PENDING
  └─ evidence incomplete ───────────────────────> REVIEW_REQUIRED

REVISED_OFFER_PENDING
  ├─ seller accepts revised offer ──────────────> APPR_FOR_PAYOUT
  └─ seller declines ────────────────────────────> RETURN_PENDING

APPR_FOR_PAYOUT
  ├─ payout/credit posted idempotently ──────────> PAID
  └─ provider failure ───────────────────────────> PAYOUT_RETRY / PAYOUT_REVIEW

SUSPECTED_COUNTERFEIT_REVIEW
  ├─ authorized compliance/legal determination ─> REJECTED_COUNTERFEIT
  ├─ genuine / insufficient evidence ────────────> RETURN_PENDING or APPR_FOR_PAYOUT
  └─ valid compulsory legal process ─────────────> LEGAL_CUSTODY_HOLD

LEGAL_CUSTODY_HOLD
  ├─ court/law-enforcement release order ────────> RETURN_PENDING / SURRENDERED
  └─ documented final lawful disposition ───────> SURRENDERED / DESTROYED
```

`REJECTED_COUNTERFEIT` records an internal determination, not a legal forfeiture. Prevent ordinary payout/listing and preserve evidence. It must not, by itself, authorize permanent seizure, destruction, or denial of return shipping. `LEGAL_CUSTODY_HOLD` requires counsel-approved legal basis/process, exact scope, serving authority, start/review date, and release conditions.

### 5.2 Conditional valuation terms and enforcement

- Each offer references the submitted photos, estimator/model version, valuation-policy version, reference data, grade assumptions, issue time, expiry, included fees/shipping terms, payout choice, and exact conditionality.
- Clearly present that the initial amount is conditional on physical receipt, identity/jurisdiction checks, item match, condition grade, and authentication; show how a revised offer or return is handled before shipment. Don't describe automated image analysis as authentication or an appraisal guarantee.
- On intake, create chain-of-custody record: sealed package ID, carrier tracking, received timestamp, intake staff, tamper/damage observations, package photos, weight, and secure bin location. Use two-person verification for high-risk cases.
- Physical authenticity is reviewed by trained staff using a documented rubric and evidence (construction, material, labels/production marks, provenance where available, packaging as non-dispositive). Require a second independent reviewer for counterfeit rejection. Keep reviewer rationale, confidence, source references, evidence object hashes, and vendor/tool version.
- Model output is advisory only. No generative model can alone reject property, withhold payout, or label a seller fraudulent. Provide human escalation and a correction/appeal path.
- On counterfeit suspicion, immediately set payout/listing false, isolate item in restricted custody, preserve package and evidence, lock relevant records under a scoped legal hold, prohibit return/payout processing until legal/compliance review. Notify the seller about the status and next steps unless lawfully prohibited; do not state “forfeited” unless a valid authority determines it.
- Obtain counsel-approved terms for genuine counterfeit cases, seller remedies, return shipping, law-enforcement referral, and any mandatory reporting. Make return-shipping suspension reason-specific and time-bounded, with review deadlines. Do not use an indefinite administrative hold or broad contractual waiver to bypass law.
- All manual state changes use an auditable command with RBAC and dual approval for counterfeit determinations, legal holds/releases, dealer-period overrides, and high-value payouts.

## 6. PostgreSQL schema proposal

The following is an implementation-oriented logical schema, not a drop-in migration. Use UUID primary keys, UTC `timestamptz`, integer minor currency units plus ISO currency, enumerated status values, constraints, indexes, row-level security, and migrations. In production, split `identity` into a separately permissioned database if required by threat model/provider requirements.

### 6.1 Core DDL

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS commerce;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TYPE commerce.account_status AS ENUM
  ('ACTIVE', 'SUSPENDED', 'DELETION_PENDING', 'DELETED');
CREATE TYPE compliance.kyc_status AS ENUM
  ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REVERIFY_REQUIRED', 'FAILED', 'REVIEW');
CREATE TYPE commerce.trade_in_status AS ENUM
  ('PENDING_PHOTOS', 'NEEDS_MORE_INFO', 'CONDITIONALLY_APPROVED',
   'INBOUND_SHIPPED', 'SHIPPING_EXCEPTION', 'RECEIVED', 'AUTHENTICATING',
   'REVIEW_REQUIRED', 'COMPLIANCE_HOLD', 'REVISED_OFFER_PENDING',
   'APPR_FOR_PAYOUT', 'PAYOUT_RETRY', 'PAYOUT_REVIEW', 'PAID',
   'SUSPECTED_COUNTERFEIT_REVIEW', 'REJECTED_COUNTERFEIT',
   'RETURN_PENDING', 'WITHDRAWN', 'DECLINED', 'OFFER_EXPIRED',
   'LEGAL_CUSTODY_HOLD', 'SURRENDERED', 'DESTROYED');
CREATE TYPE commerce.inventory_status AS ENUM
  ('INTAKE', 'INSPECTION', 'AUTHENTICATED', 'HOLDING_PERIOD',
   'AVAILABLE', 'RESERVED', 'SOLD', 'RETURNED_TO_SELLER',
   'SUSPECTED_COUNTERFEIT', 'LEGAL_CUSTODY_HOLD', 'SURRENDERED', 'DESTROYED');
CREATE TYPE commerce.ledger_account_type AS ENUM
  ('USER_LIABILITY', 'CASH_CLEARING', 'PAYOUT_CLEARING', 'REVENUE',
   'TAX_PAYABLE', 'REFUND_PAYABLE', 'ESHEAT_PAYABLE');

CREATE TABLE commerce.app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status commerce.account_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- PII fields are envelope-encrypted by the service before insertion.
-- Do not grant the ordinary application role access to this table.
CREATE TABLE identity.user_pii (
  user_id uuid PRIMARY KEY REFERENCES commerce.app_user(id),
  email_ciphertext bytea NOT NULL,
  email_nonce bytea NOT NULL,
  email_key_version text NOT NULL,
  email_lookup_hmac bytea NOT NULL UNIQUE,
  legal_name_ciphertext bytea,
  name_nonce bytea,
  name_key_version text,
  phone_ciphertext bytea,
  phone_nonce bytea,
  phone_key_version text,
  birth_date_ciphertext bytea,
  birth_date_nonce bytea,
  birth_date_key_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.user_address (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES commerce.app_user(id),
  address_ciphertext bytea NOT NULL,
  nonce bytea NOT NULL,
  key_version text NOT NULL,
  address_lookup_hmac bytea,
  purpose text NOT NULL CHECK (purpose IN ('RETURN', 'TAX_DESTINATION', 'CONTACT')),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX user_address_owner_idx ON identity.user_address(user_id) WHERE deleted_at IS NULL;

CREATE TABLE identity.auth_credential (
  user_id uuid PRIMARY KEY REFERENCES commerce.app_user(id),
  password_hash text NOT NULL, -- Argon2id encoded hash; never reversible
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES commerce.app_user(id),
  token_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  idle_expires_at timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (idle_expires_at <= absolute_expires_at)
);
CREATE INDEX session_live_user_idx ON identity.session(user_id, absolute_expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE compliance.kyc_case (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES commerce.app_user(id),
  provider text NOT NULL,
  provider_subject_ref_ciphertext bytea NOT NULL,
  ref_nonce bytea NOT NULL,
  ref_key_version text NOT NULL,
  status compliance.kyc_status NOT NULL DEFAULT 'NOT_STARTED',
  jurisdiction_code text NOT NULL,
  reason_code text,
  verified_at timestamptz,
  reverify_at timestamptz,
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kyc_user_latest_idx ON compliance.kyc_case(user_id, created_at DESC);

CREATE TABLE compliance.jurisdiction_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code text NOT NULL,
  dealer_type text NOT NULL,
  item_category text NOT NULL DEFAULT 'FOOTWEAR',
  effective_from date NOT NULL,
  effective_until date,
  license_required boolean NOT NULL,
  identity_policy jsonb NOT NULL,
  reporting_policy jsonb NOT NULL,
  holding_days integer NOT NULL CHECK (holding_days >= 0),
  holding_policy jsonb NOT NULL,
  retention_policy jsonb NOT NULL,
  legal_citation text NOT NULL,
  counsel_approval_ref text NOT NULL,
  approved_by uuid NOT NULL REFERENCES commerce.app_user(id),
  reviewed_at timestamptz NOT NULL,
  next_review_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT false,
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);
CREATE INDEX jurisdiction_rule_lookup_idx
  ON compliance.jurisdiction_rule(jurisdiction_code, dealer_type, effective_from)
  WHERE active = true;

CREATE TABLE commerce.trade_in (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES commerce.app_user(id),
  status commerce.trade_in_status NOT NULL DEFAULT 'PENDING_PHOTOS',
  acquisition_jurisdiction_code text NOT NULL,
  rule_id uuid NOT NULL REFERENCES compliance.jurisdiction_rule(id),
  rule_snapshot jsonb NOT NULL, -- immutable applied rule facts/version, no raw PII
  currency char(3) NOT NULL DEFAULT 'USD',
  initial_offer_minor bigint CHECK (initial_offer_minor >= 0),
  revised_offer_minor bigint CHECK (revised_offer_minor >= 0),
  offer_expires_at timestamptz,
  seller_accepted_at timestamptz,
  received_at timestamptz,
  eligible_at timestamptz,
  payout_approved_at timestamptz,
  paid_at timestamptz,
  legal_hold boolean NOT NULL DEFAULT false,
  police_hold boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX trade_in_seller_idx ON commerce.trade_in(seller_id, created_at DESC);
CREATE INDEX trade_in_state_idx ON commerce.trade_in(status, updated_at);

CREATE TABLE commerce.trade_in_photo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL REFERENCES commerce.trade_in(id),
  object_key text NOT NULL UNIQUE,
  sha256 bytea NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image/jpeg', 'image/png', 'image/webp')),
  width integer NOT NULL CHECK (width > 0),
  height integer NOT NULL CHECK (height > 0),
  transform_version text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('SELLER_SUBMISSION', 'INTAKE', 'INSPECTION', 'AUTHENTICATION')),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  deletion_due_at timestamptz,
  legal_hold boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);
CREATE INDEX trade_in_photo_parent_idx ON commerce.trade_in_photo(trade_in_id);

CREATE TABLE commerce.trade_in_event (
  id bigserial PRIMARY KEY,
  trade_in_id uuid NOT NULL REFERENCES commerce.trade_in(id),
  from_status commerce.trade_in_status,
  to_status commerce.trade_in_status NOT NULL,
  actor_user_id uuid REFERENCES commerce.app_user(id),
  actor_service text,
  reason_code text NOT NULL,
  evidence_ref text,
  idempotency_key text NOT NULL UNIQUE,
  policy_version text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX trade_in_event_history_idx ON commerce.trade_in_event(trade_in_id, occurred_at);

CREATE TABLE compliance.dealer_report (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL UNIQUE REFERENCES commerce.trade_in(id),
  jurisdiction_code text NOT NULL,
  rule_id uuid NOT NULL REFERENCES compliance.jurisdiction_rule(id),
  reporting_provider text NOT NULL,
  external_report_ref_ciphertext bytea,
  external_ref_nonce bytea,
  external_ref_key_version text,
  status text NOT NULL CHECK (status IN ('NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'ERROR')),
  submitted_at timestamptz,
  accepted_at timestamptz,
  receipt_hash bytea,
  retention_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE commerce.shipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL REFERENCES commerce.trade_in(id),
  carrier text NOT NULL,
  tracking_ref_ciphertext bytea,
  tracking_nonce bytea,
  tracking_key_version text,
  direction text NOT NULL CHECK (direction IN ('INBOUND', 'RETURN')),
  status text NOT NULL,
  shipped_at timestamptz,
  delivered_at timestamptz,
  custody_seal_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE commerce.condition_rubric (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  definition jsonb NOT NULL,
  effective_at timestamptz NOT NULL,
  retired_at timestamptz
);

CREATE TABLE commerce.condition_grade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id uuid NOT NULL REFERENCES commerce.condition_rubric(id),
  dimension text NOT NULL CHECK (dimension IN
    ('UPPER', 'OUTSOLE', 'MIDSOLE', 'INSOLE', 'STRUCTURAL', 'CLEANLINESS', 'COMPLETENESS', 'OVERALL')),
  grade_code text NOT NULL,
  ordinal smallint NOT NULL CHECK (ordinal BETWEEN 0 AND 100),
  label text NOT NULL,
  criteria text NOT NULL,
  UNIQUE (rubric_id, dimension, grade_code),
  UNIQUE (rubric_id, dimension, ordinal)
);

CREATE TABLE commerce.shoe_identifier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL REFERENCES commerce.trade_in(id),
  manufacturer text,
  model text,
  style_code text,
  size_label text,
  width_label text,
  colorway text,
  production_country text,
  production_lot text,
  production_code_ciphertext bytea,
  production_code_nonce bytea,
  production_code_key_version text,
  production_code_hmac bytea,
  identifier_type text NOT NULL,
  observed_location text,
  verified_by uuid REFERENCES commerce.app_user(id),
  verified_at timestamptz,
  source_photo_id uuid REFERENCES commerce.trade_in_photo(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shoe_identifier_search_hmac_idx
  ON commerce.shoe_identifier(production_code_hmac) WHERE production_code_hmac IS NOT NULL;

CREATE TABLE commerce.inspection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL REFERENCES commerce.trade_in(id),
  rubric_id uuid NOT NULL REFERENCES commerce.condition_rubric(id),
  grader_id uuid NOT NULL REFERENCES commerce.app_user(id),
  upper_grade_id uuid NOT NULL REFERENCES commerce.condition_grade(id),
  outsole_grade_id uuid NOT NULL REFERENCES commerce.condition_grade(id),
  midsole_grade_id uuid NOT NULL REFERENCES commerce.condition_grade(id),
  insole_grade_id uuid NOT NULL REFERENCES commerce.condition_grade(id),
  structural_grade_id uuid NOT NULL REFERENCES commerce.condition_grade(id),
  cleanliness_grade_id uuid NOT NULL REFERENCES commerce.condition_grade(id),
  completeness_grade_id uuid NOT NULL REFERENCES commerce.condition_grade(id),
  overall_grade_id uuid NOT NULL REFERENCES commerce.condition_grade(id),
  defects jsonb NOT NULL DEFAULT '[]',
  notes_ciphertext bytea,
  notes_nonce bytea,
  notes_key_version text,
  inspected_at timestamptz NOT NULL DEFAULT now(),
  supersedes_id uuid REFERENCES commerce.inspection(id)
);
CREATE INDEX inspection_trade_in_history_idx ON commerce.inspection(trade_in_id, inspected_at DESC);

CREATE TABLE commerce.authenticity_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL REFERENCES commerce.trade_in(id),
  reviewer_id uuid NOT NULL REFERENCES commerce.app_user(id),
  determination text NOT NULL CHECK (determination IN ('AUTHENTIC', 'SUSPECTED_COUNTERFEIT', 'INCONCLUSIVE')),
  rationale_code text NOT NULL,
  rubric_version text NOT NULL,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  evidence jsonb NOT NULL DEFAULT '[]',
  second_review_id uuid REFERENCES commerce.authenticity_review(id),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE compliance.legal_hold (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL REFERENCES commerce.trade_in(id),
  authority_type text NOT NULL,
  authority_ref_ciphertext bytea NOT NULL,
  ref_nonce bytea NOT NULL,
  ref_key_version text NOT NULL,
  scope jsonb NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_or_review_at timestamptz NOT NULL,
  released_at timestamptz,
  approved_by uuid NOT NULL REFERENCES commerce.app_user(id),
  second_approved_by uuid NOT NULL REFERENCES commerce.app_user(id),
  release_authority_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (approved_by <> second_approved_by)
);

CREATE TABLE commerce.inventory_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL UNIQUE REFERENCES commerce.trade_in(id),
  status commerce.inventory_status NOT NULL DEFAULT 'INTAKE',
  acquired_at timestamptz NOT NULL,
  jurisdiction_code text NOT NULL,
  rule_id uuid NOT NULL REFERENCES compliance.jurisdiction_rule(id),
  dealer_report_id uuid REFERENCES compliance.dealer_report(id),
  eligible_at timestamptz,
  listed_at timestamptz,
  police_hold boolean NOT NULL DEFAULT false,
  legal_hold boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (eligible_at IS NULL OR eligible_at >= acquired_at)
);
CREATE INDEX inventory_release_idx ON commerce.inventory_item(status, eligible_at)
  WHERE police_hold = false AND legal_hold = false;

CREATE TABLE commerce.product_listing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL UNIQUE REFERENCES commerce.inventory_item(id),
  status text NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNLISTED', 'SOLD')),
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  currency char(3) NOT NULL DEFAULT 'USD',
  public_condition_summary text NOT NULL,
  published_at timestamptz,
  unpublished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_listing_public_idx ON commerce.product_listing(status, published_at DESC)
  WHERE status = 'PUBLISHED';

CREATE TABLE commerce.sales_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES commerce.app_user(id),
  status text NOT NULL CHECK (status IN
    ('PENDING_PAYMENT', 'PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED',
     'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTED')),
  currency char(3) NOT NULL,
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  discount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  tax_minor bigint NOT NULL CHECK (tax_minor >= 0),
  shipping_minor bigint NOT NULL CHECK (shipping_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  destination_ciphertext bytea NOT NULL,
  destination_nonce bytea NOT NULL,
  destination_key_version text NOT NULL,
  destination_state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  CHECK (discount_minor <= subtotal_minor),
  CHECK (total_minor = subtotal_minor - discount_minor + tax_minor + shipping_minor)
);
CREATE INDEX sales_order_buyer_idx ON commerce.sales_order(buyer_id, created_at DESC);

CREATE TABLE commerce.sales_order_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES commerce.sales_order(id),
  listing_id uuid NOT NULL REFERENCES commerce.product_listing(id),
  inventory_item_id uuid NOT NULL REFERENCES commerce.inventory_item(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity = 1), -- each authenticated pair is unique
  unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
  tax_minor bigint NOT NULL CHECK (tax_minor >= 0),
  currency char(3) NOT NULL,
  item_snapshot jsonb NOT NULL, -- public listing/grade snapshot at purchase, no seller PII
  UNIQUE (inventory_item_id)
);

CREATE TABLE commerce.payment_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES commerce.sales_order(id),
  provider text NOT NULL,
  provider_payment_ref text NOT NULL,
  provider_event_ref text,
  status text NOT NULL CHECK (status IN
    ('REQUIRES_ACTION', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'VOIDED', 'REFUNDED', 'DISPUTED')),
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  captured_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_ref)
);

CREATE TABLE commerce.wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES commerce.app_user(id),
  currency char(3) NOT NULL,
  status text NOT NULL CHECK (status IN ('OPEN', 'RESTRICTED', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE commerce.ledger_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES commerce.wallet(id),
  account_type commerce.ledger_account_type NOT NULL,
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE commerce.ledger_transaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  source_type text NOT NULL,
  source_ref uuid NOT NULL,
  description_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE commerce.ledger_entry (
  id bigserial PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES commerce.ledger_transaction(id),
  account_id uuid NOT NULL REFERENCES commerce.ledger_account(id),
  amount_minor bigint NOT NULL CHECK (amount_minor <> 0),
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledger_entry_account_idx ON commerce.ledger_entry(account_id, created_at);
-- Ledger entries are append-only. A deferred transaction-level check must guarantee
-- that entries sum to zero per currency before a ledger_transaction can commit.

CREATE TABLE commerce.stored_value_lot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES commerce.wallet(id),
  issued_transaction_id uuid NOT NULL REFERENCES commerce.ledger_transaction(id),
  original_amount_minor bigint NOT NULL CHECK (original_amount_minor > 0),
  currency char(3) NOT NULL,
  issued_at timestamptz NOT NULL,
  legal_type text NOT NULL,
  state_of_issuance text,
  escheat_owner_state text,
  last_activity_at timestamptz NOT NULL,
  escheat_review_at timestamptz,
  escheat_status text NOT NULL DEFAULT 'NOT_DUE'
    CHECK (escheat_status IN ('NOT_DUE', 'REVIEW', 'DUE', 'REPORTED', 'REMITTED', 'EXEMPT')),
  escheat_rule_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stored_value_escheat_idx ON commerce.stored_value_lot(escheat_review_at, escheat_status);

CREATE TABLE compliance.stored_value_escheat_event (
  id bigserial PRIMARY KEY,
  stored_value_lot_id uuid NOT NULL REFERENCES commerce.stored_value_lot(id),
  action text NOT NULL CHECK (action IN
    ('DUE_DILIGENCE_SENT', 'OWNER_RESPONSE', 'REPORT_PREPARED',
     'REPORTED', 'REMITTED', 'STATE_RECEIPT', 'RULE_REVIEW')),
  jurisdiction_code text,
  amount_minor bigint CHECK (amount_minor IS NULL OR amount_minor >= 0),
  currency char(3),
  evidence_ref text,
  rule_version text NOT NULL,
  actor_ref text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stored_value_escheat_event_history_idx
  ON compliance.stored_value_escheat_event(stored_value_lot_id, occurred_at);

CREATE TABLE commerce.tax_quote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref uuid NOT NULL REFERENCES commerce.sales_order(id),
  provider text NOT NULL,
  provider_quote_ref text NOT NULL,
  destination_address_hmac bytea NOT NULL,
  destination_state text NOT NULL,
  line_items jsonb NOT NULL,
  tax_breakdown jsonb NOT NULL,
  tax_minor bigint NOT NULL CHECK (tax_minor >= 0),
  currency char(3) NOT NULL,
  nexus_policy_version text NOT NULL,
  tax_engine_version text,
  quoted_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  committed_at timestamptz,
  UNIQUE (provider, provider_quote_ref)
);

CREATE TABLE audit.access_event (
  id bigserial PRIMARY KEY,
  actor_type text NOT NULL,
  actor_ref text NOT NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_ref uuid,
  purpose_code text NOT NULL,
  case_ref uuid,
  correlation_id uuid NOT NULL,
  source_ip_hmac bytea,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_access_object_idx ON audit.access_event(object_type, object_ref, occurred_at);

CREATE TABLE compliance.tax_nexus_monitor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code text NOT NULL,
  measurement_period_start date NOT NULL,
  measurement_period_end date NOT NULL,
  gross_sales_minor bigint NOT NULL CHECK (gross_sales_minor >= 0),
  transaction_count bigint NOT NULL CHECK (transaction_count >= 0),
  sales_threshold_minor bigint,
  transaction_threshold bigint,
  physical_presence boolean NOT NULL DEFAULT false,
  measured_at timestamptz NOT NULL,
  provider text NOT NULL,
  policy_version text NOT NULL,
  nexus_status text NOT NULL CHECK (nexus_status IN
    ('BELOW_THRESHOLD', 'APPROACHING', 'REGISTRATION_REQUIRED', 'REGISTERED', 'REVIEW')),
  registration_verified_at timestamptz,
  next_review_at timestamptz NOT NULL,
  UNIQUE (jurisdiction_code, measurement_period_start, measurement_period_end, provider),
  CHECK (measurement_period_end >= measurement_period_start)
);
CREATE INDEX tax_nexus_review_idx ON compliance.tax_nexus_monitor(nexus_status, next_review_at);

CREATE TABLE compliance.privacy_deletion_case (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES commerce.app_user(id),
  status text NOT NULL CHECK (status IN
    ('RECEIVED', 'VERIFYING', 'IN_PROGRESS', 'EXCEPTION_REVIEW',
     'COMPLETED', 'DENIED', 'CLOSED')),
  received_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  verified_at timestamptz,
  completed_at timestamptz,
  exception_category text,
  exception_basis_ref text,
  review_due_at timestamptz,
  created_by_service text NOT NULL
);

CREATE TABLE compliance.processor_deletion_task (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deletion_case_id uuid NOT NULL REFERENCES compliance.privacy_deletion_case(id),
  processor text NOT NULL,
  processor_subject_ref text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING', 'SENT', 'CONFIRMED', 'FAILED', 'NOT_SUPPORTED')),
  attempted_at timestamptz,
  confirmed_at timestamptz,
  evidence_ref text,
  UNIQUE (deletion_case_id, processor)
);
```

### 6.2 Schema and implementation notes

- The DDL is illustrative. Validate jurisdiction-specific fields with counsel and the relevant reporting system before migration.
- Apply RLS policies by `user_id` for seller-visible records. Staff access is through a separate audited service/API and roles, not a blanket `is_admin` client claim.
- `rule_snapshot` must exclude plaintext PII while recording the exact policy version and computed deadlines. Do not let clients update status, `eligible_at`, `legal_hold`, `police_hold`, payment amount, or tax amount.
- Use database transactions and `SELECT ... FOR UPDATE` (or equivalent optimistic version checks) around state transitions and ledger posting. Use unique idempotency keys for every external callback and money movement.
- Enforce state transition graph in a domain service and database constraints/trigger as defense in depth. Database owners/migrations are separate from the runtime role.
- An immutable ledger uses balanced debit/credit entries; wallet balance is derived from posted entries or a rebuildable cache. Never edit/delete a posted ledger entry; corrections are compensating transactions.
- Financial entries are integer minor units; store currency and rounding/tax-engine calculation reference. Avoid floating point for money.
- KYC and object references should be opaque and encrypted where they reveal identity. Redact exception traces and query parameter logging.
- Add retention partitions and deletion tooling only after confirming the retention/legal hold matrix; never expire evidence needed for an active report, dispute, audit, or legal order.

## 7. Stored value, CARD Act, and unclaimed property

- Model store credit as a liability in an append-only double-entry ledger, not a mutable `balance` column. Each issue, redemption, refund, reversal, and adjustment is a new balanced transaction with source reference and idempotency key.
- Adopt a product policy of no expiration and no inactivity/service fee for customer balances. This is intentionally stricter than the federal baseline: Regulation E generally prohibits expiration of covered funds before five years after issuance or the last load; it permits certain dormancy/service fees only after at least 12 months of inactivity and subject to monthly limits and disclosure conditions. Coverage has definitions and exceptions, and state law may be stricter. Do not use “store credit” naming or UX to assume a balance falls outside gift-card rules. Determine whether each instrument is a covered gift certificate, store gift card, loyalty/reward, promotional code, refund, or state-specific stored value.
- Preserve original issuance amount/date, state of issuance, owner address state when legally relevant, instrument type, last activity, outstanding amount, and current escheatment rule version. A balance must not be removed merely because an internal timer elapsed.
- Compute potential unclaimed-property reporting/remittance by state, instrument type, owner residence/last-known address, dormancy period, due diligence requirements, filing date, and statutory exemption. Track owner outreach, notice, response, remittance, and state receipt in a separate case table. States differ; counsel/third-party escheatment provider validates each rule. Unclaimed property may have an obligation even when the consumer balance itself has no expiration.
- Treat dormancy periods and reporting as state- and property-specific, not as a single national timer. For example, California has a general three-year rule for certain property held or owing in the ordinary course of business, subject to exceptions and notice requirements; counsel must determine whether and how a particular seller balance or store-credit instrument is covered.
- Reconcile ledger liability to payment/acquisition clearing and outstanding instruments daily. Alert on imbalance, stale liabilities, suspicious staff adjustments, duplicate webhooks, and failed remittances.
- Provide statement/history and balance disclosure. Refunds/chargebacks and account deletion do not erase statutory stored-value or escheatment records.

## 8. Tax and payment boundaries

### 8.1 External tax engine

- Integrate a tax provider server-to-server. The browser sends a cart/ship-to request; the server loads authoritative SKU, tax category, price, discounts, and destination; then requests a tax quote. Ignore client-submitted tax rates and totals.
- Preserve the provider quote ID, jurisdiction breakdown, taxable basis, exemptions, product tax codes, shipping treatment, sourcing method, nexus policy/version, quote time/expiry, and final transaction result. Use the provider's committed transaction API after successful capture; void/reverse on cancellation/refund as required.
- Configure economic-nexus thresholds, physical presence, marketplace-facilitator treatment, origin/destination sourcing, footwear/product exemptions, shipping taxability, and local rates per state through counsel/tax advisor and the provider. Thresholds and rules change; synchronize and review provider updates. Do not hardcode one threshold or assume a vendor automatically registers/remits for the merchant.
- Treat trade-in consideration and resale as separate tax/accounting events. Whether trade-in credit changes taxable sales price or is a reseller purchase is jurisdiction- and transaction-specific; obtain tax advice and encode the reviewed treatment in versioned configuration.
- Reconcile provider reports to order ledger and returns; alert for nexus threshold approach, missing registration, quote mismatch, failed commit, and unfiled periods.

### 8.2 Payment/PCI design

- Use a PCI-validated payment provider's hosted checkout or hosted iframe/Elements that tokenizes directly to the provider. Card data must travel from the buyer's browser to the provider, never through Tradits' API, serverless function, logs, database, observability, or support tools.
- The app server creates a payment intent/session using authoritative amount/currency and idempotency key. Browser confirms using provider-controlled elements. Verify signed webhooks server-side and deduplicate by provider event ID before committing order/ledger state.
- Store provider customer/payment method IDs only when needed and permitted; never store PAN, CVV, track data, PIN, or raw payment credentials. Do not assume hosted fields alone make the merchant out of PCI scope; complete the applicable SAQ and confirm scope with the acquirer/QSA.
- Payouts to sellers use a separate provider-hosted connected-account/onboarding/KYC flow. Persist opaque payout account references and status, not bank account/routing numbers. Require verified seller identity, approved trade-in, risk checks, and jurisdiction gates before payout.
- Reconcile authorized, captured, refunded, disputed, failed, and paid-out states; enforce webhook signature verification, replay protection, stable idempotency, amount/currency matching, and dual-control manual adjustments.

## 9. WCAG 2.1 AA / ADA accessibility requirements

Use WCAG 2.1 AA as the engineering target and verify against the actual pages and third-party components. DOJ guidance recognizes ADA obligations for public-facing businesses and their online goods and services, but Title III does not currently prescribe a detailed technical website standard; WCAG 2.1 AA is an engineering target, not by itself a legal safe harbor or proof of compliance. The separate DOJ Title II web rule specifies WCAG 2.1 AA for covered public entities, not ordinary private retailers. Applicability and obligations depend on the entity and circumstances. Accessibility is a release gate, not a one-time scan.

### 9.1 Keyboard and visual interaction

- All controls are reachable in logical DOM order with `Tab`/`Shift+Tab`; activate buttons with `Enter`/`Space`; native select and file chooser remain keyboard-operable. No pointer-only drag-drop requirement: expose a visible “Choose photo” button and accept drop as an optional enhancement.
- Focus indicator is visible, high-contrast, not obscured by sticky headers, and follows logical order. After upload completion/error, keep focus stable or deliberately focus the status heading only when the user must respond.
- Do not trap focus except in a modal; if a cropper/preview dialog exists, implement Escape close, focus trap, initial focus, restore focus to trigger, and an accessible name/description.
- Category filters and multi-step checkout use native buttons/links with accurate state. For tabs/stepper widgets, implement the complete WAI-ARIA keyboard pattern; otherwise use ordinary headings and buttons rather than fake ARIA roles.
- Do not communicate grade, error, or hold status by color alone. Text and icon labels accompany colors; preserve contrast for text, focus, controls, and disabled states.
- Support zoom/reflow at 200% and narrow widths without horizontal scrolling; use responsive layouts, minimum target sizes consistent with WCAG 2.2 target-size guidance where practicable, and respect reduced motion.
- Every shoe photo has informative alt text if it conveys product details; decorative repeated images use empty alt. Error and status content is programmatically associated with its input.

### 9.2 Image uploader and valuation

- Use a real labeled `<input type="file">` with `accept` matching server allowlist. The custom drop area is a label/button wrapper with visible focus when the input receives focus; the browse button works without drag/drop.
- Announce selected filename, validation result, upload progress, evaluation start/completion, and failure via a polite `aria-live="polite"` status region. Use `role="alert"`/assertive announcement for an error requiring immediate action, but avoid repeated alerts.
- Set `aria-busy="true"` on the evaluation region while processing; use native `<progress>` with accessible label/value if determinate progress exists. Do not fabricate percentages for provider work.
- Put format/size requirements in visible text and associate with input using `aria-describedby`; use `aria-invalid="true"` and link to clear error text by ID after validation failure.
- On retry, retain or clear selected filename consistently and say what happened. Never announce raw provider stack traces. Tell the user when image is transmitted to an AI processor and link to the privacy disclosure.
- Dynamic offer updates must be text, not color/animation alone. Make amount and conditions understandable; announce completion once, not every rerender. State estimates are conditional and not definitive authentication.

### 9.3 Account dashboard and checkout

- Landmark regions have unique accessible names; page has one meaningful H1; headings follow hierarchy. Tables use headers; status badges include text; chart summaries have an equivalent textual table.
- Account forms have persistent labels, instructions, field-level errors, summary errors, autocomplete tokens, and no unexpectedly timed data entry. Session expiry warns users and supports extension where safe.
- Checkout stepper announces current step with `aria-current="step"`; each panel has heading. Save progress only with consent/security controls. Maintain address/payment state without exposing sensitive values to analytics. Focus first invalid field or error summary and provide a summary link to each invalid field.
- Hosted payment iframe must be keyboard traversable and screen-reader tested. Provide provider errors outside the iframe in accessible text; never capture card information in app forms as a fallback.
- On asynchronous tax quote/payment confirmation, use `aria-live` status; prevent duplicate submission with disabled/busy state and a clear explanation. Keep focus and order summary stable.

Required component attributes/patterns (use only when semantically appropriate):

```text
Uploader: <label for>, aria-describedby, aria-invalid, role="status",
          aria-live="polite", aria-busy, role="alert" on blocking errors
Checkout step: aria-current="step"; errors linked with aria-describedby
Toggle: native button with aria-pressed; checkbox input with label
Modal: role="dialog", aria-modal="true", aria-labelledby, aria-describedby
Menu: native button with aria-expanded and aria-controls
Images: meaningful alt or alt="" when decorative
```

Testing requirements: keyboard-only walkthrough; NVDA + Firefox/Chrome and VoiceOver + Safari smoke tests; automated axe scan plus manual screen-reader checks; 200% zoom and 320 CSS-pixel reflow; contrast testing; errors, loading, empty, success, expired-session, and third-party iframe states. Automated checks cannot certify WCAG conformance.

## 10. API and service boundaries

Suggested Next.js route handlers/domain-service contract (all state-changing routes authenticate and authorize server-side):

| Endpoint/command | Core enforcement |
|---|---|
| `POST /api/uploads/intents` | Authenticated owner, purpose, allowlist/size, per-user quota/rate limit, quarantine key, short-lived signed URL |
| `POST /api/trade-ins` | Jurisdiction gate, KYC policy, idempotency, rule snapshot, initial `PENDING_PHOTOS` |
| `POST /api/trade-ins/:id/submit-photos` | Ownership check, sanitized object exists, required photo count, valuation policy; conditional offer only |
| `POST /api/trade-ins/:id/accept-offer` | Seller ownership, unexpired exact offer version, current required disclosures, electronic acceptance evidence |
| Carrier webhook | Signature validation, event deduplication, tracking-to-shipment match, custody event |
| Dealer report command | Current rule, required fields, encrypted PII projection, provider receipt; no unnecessary broad export |
| `POST /api/inspections/:id/decision` | Staff role, rubric/version, evidence, dual authentication review for counterfeit |
| `POST /api/holds/:id/release` | Legal/compliance authority, two-person approval, scope and expiry validation |
| `POST /api/payouts` | Eligible trade-in, KYC, risk/jurisdiction gates, idempotent provider transfer, ledger transaction |
| `POST /api/tax/quote` | Server-authoritative cart and destination; provider quote stored with expiry/version |
| Payment webhook | Provider signature, event deduplication, amount/currency check, atomic order + ledger update |
| `POST /api/privacy/deletion-requests` | Verified requester, case lifecycle, processor fan-out, retention exceptions |
| Law-enforcement request service | Verified authority, counsel approval where required, scope minimization, response log |

Use a domain/service layer for the state machine, tax/payout eligibility, and ledger. Route handlers should parse/validate, authenticate, invoke a command, and serialize a safe response; they must not own business rules. Background work uses a durable queue with retries, dead-letter handling, idempotency, observability, and no client-trusted state.

## 11. Deployment, monitoring, and incident controls

- Separate development, preview, staging, and production cloud accounts/buckets/database projects. Preview deployments cannot access real KYC, production seller data, production payouts, or production signing keys.
- Use TLS everywhere, private networking where available, least-privilege IAM, KMS key rotation, short-lived workload credentials, bucket public-access block, object versioning only with defined retention, and lifecycle rules for quarantine.
- Set Vercel environment variables per environment; only public non-secret values use `NEXT_PUBLIC_`. Keep KYC, PSP, tax, KMS, and model-provider credentials server-side. Rotate secrets and document emergency revocation.
- Protect deployment branch, require reviewed changes and CI, pin dependencies/lockfile, run SAST/dependency/secret checks, produce SBOM, scan container/worker images, and rehearse rollback. Restrict Vercel team membership and use MFA/SSO.
- Log correlation IDs and object UUIDs, not PII, image bytes, access tokens, raw request bodies, address, ID, PAN, or provider payloads. Redact querystrings. Protect audit logs from application update/delete.
- Alert on unusual KYC/document access, staff exports, multiple accounts per device/address, listing while ineligible, payout retries, ledger imbalance, hold bypass attempts, high upload failure/malware rate, webhook signature failures, tax mismatches, deletion SLA, and backup lifecycle.
- Incident plan covers lost/stolen data, counterfeit discovery after sale, police/court request, misdirected payout, tax calculation failure, account takeover, image malware, and breach notification. Keep contacts, legal decision tree, evidence preservation, vendor escalation, and tabletop exercises current.
- Set SLOs for auth, upload processing, transaction state, webhook processing, deletion processing, and availability. Queue outages fail closed for listing/payout; do not bypass checks to preserve uptime.

## 12. Deployment-ready checklist

### Product and legal readiness

- [ ] Written counsel approval for every city/state in which goods are acquired, held, shipped, listed, or sold; licenses/registrations obtained and renewal calendar assigned.
- [ ] Jurisdiction matrix covers online/mail-in footwear, seller age/ID, report schema and deadline, acquisition date, hold period, police hold, allowed release, record retention, and disclosure.
- [ ] Counsel reviews valuation terms, condition rubric, revised/declined offers, return shipping, suspected-counterfeit handling, legal process, seller notice, and consumer remedies.
- [ ] Privacy notice accurately describes account, photo, AI processor, KYC, fraud, law-enforcement, tax, retention, sharing, rights, and deletion exceptions.
- [ ] Terms of Service and seller trade-in agreement explain conditional offer, physical inspection, authentication limits, custody, shipment loss, revised offer, return process, dispute/contact process, and applicable law without unsupported forfeiture language.
- [ ] Used-product listing has an item-specific condition description, photographs, included accessories, and clear “pre-owned/as-is” language reviewed for applicable implied-warranty/consumer-protection restrictions; “as-is” does not override nonwaivable rights.
- [ ] DMCA agent/contact process is established and agent designation submitted/kept current if relying on the U.S. online-service-provider safe harbor; DMCA terms include compliant notice/counter-notice process as applicable.
- [ ] Accessibility statement gives an accessible contact and remediation process; statement does not substitute for actual accessible implementation.
- [ ] Card/store credit classifications, CARD Act applicability, redemption disclosures, state gift-card laws, unclaimed-property treatment, and escheatment provider/process approved.
- [ ] Seller payout/tax reporting obligations (including information returns where applicable), tax registration/nexus and resale-certificate workflow are reviewed by tax counsel/advisor.
- [ ] Consumer-facing AI language does not claim certainty, authenticates shoes only through physical review, and distinguishes an estimate from an enforceable accepted offer.
- [ ] Required legal pages are published and linked before signup, upload, offer acceptance, payment, and seller payout: **Privacy Policy**, **Terms of Service**, **Seller Trade-In Terms**, **Accessibility Statement**, contact/support, and applicable return/refund/shipping policy; DMCA agent details are included where applicable.

### Engineering and operations readiness

- [ ] PostgreSQL migrations, roles, RLS, PII separation, AES-256-GCM envelope encryption, KMS rotation, encrypted backups, and restore test.
- [ ] Argon2id authentication, MFA for staff, secure cookie/session lifecycle, CSRF/origin controls, shared rate limiter, recovery and session revocation tested.
- [ ] Private quarantine/evidence buckets; short-lived least-scope signed URLs; magic-byte validation, image limits, malware scan, EXIF/GPS removal, safe re-encode, retention lifecycle, and no public access verified.
- [ ] KYC hosted flow and staff access separation; no production ID in preview, general app DB, logs, or support console.
- [ ] Jurisdiction rules reviewed, versioned, effective-dated; unknown jurisdiction fails closed; dealer reporting receipts and hold release verified.
- [ ] Trade-in state graph, immutable event log, counterfeit dual review, legal hold workflow, chain-of-custody, return/payout gates, and adversarial transition tests.
- [ ] Database listing/query/search/cache and all purchase paths enforce eligibility predicate using database/server time.
- [ ] Balanced append-only wallet ledger, no expiry/inactivity-fee logic for covered value, reconciliation, unclaimed-property state rules, notices, and filings.
- [ ] Tax engine server integration, registrations, destination sourcing, product tax code, commit/void/refund paths, nexus monitoring, and test transactions.
- [ ] Hosted PSP fields, webhook signature/idempotency, no PAN/CVV logging/storage, payout provider onboarding, and PCI scope/SAQ confirmed with acquirer/QSA.
- [ ] Data map, processor/subprocessor DPAs, retention schedule, deletion workflow including object versions/backups/vendors, rights request SLAs, and legal hold exceptions.
- [ ] WCAG 2.1 AA manual and automated test plan passes keyboard, screen reader, zoom/reflow, contrast, forms, uploads, checkout, errors, and payment iframe.
- [ ] CI: tests, type/lint, build, SAST, dependency/secret scans, SBOM, migration checks, webhook simulation, state-machine/property tests, ledger balancing, tax/rule regression suite.
- [ ] Production monitoring, security incident runbook, breach notification counsel, vendor outage procedures, abuse support process, backup restore, and staff training tested.

### Application-specific gaps at time of this document

The current repository is a Next.js storefront with a static JSON product catalog, browser-local cart/credit behavior, and a prototype Gemini photo scan. It does **not** currently implement PostgreSQL/Prisma persistence, accounts, KYC, dealer reporting/holding periods, physical inspection custody, counterfeit legal review, a ledger, a tax engine, or real payment processing. The existing `/api/scan` accepts base64 image input and uses heuristic estimate logic; it must not be treated as a production valuation, authentication, or safe upload pipeline. Do not launch the described business model until the above controls are implemented, independently tested, and approved by qualified counsel and the relevant compliance providers.

## 13. Primary references (verify current versions before launch)

This list is orientation for engineering and counsel, not a conclusion that any particular law applies to Tradits.

1. **CARD Act / Regulation E gift-card rules:** 15 U.S.C. § 1693l-1, [Electronic Fund Transfer Act — gift card provisions](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title15-section1693l-1&num=0&edition=prelim); 12 C.F.R. § 1005.20, [Electronic Fund Transfers (Regulation E)](https://www.consumerfinance.gov/rules-policy/regulations/1005/20/). Covered expiration/fee rules have definitions and exceptions; states may be stricter.
2. **FTC privacy/security enforcement:** FTC Act § 5, 15 U.S.C. § 45, [Federal Trade Commission Act](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title15-section45&num=0&edition=prelim); FTC, [Start with Security: A Guide for Business](https://www.ftc.gov/business-guidance/resources/start-security-guide-business); FTC, [Protecting Personal Information: A Guide for Business](https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business). These are guidance/enforcement context, not a universal safe-harbor checklist.
3. **State/local secondhand dealer laws:** Requirements are jurisdiction-specific. Examples: California Bus. & Prof. Code §§ 21625–21647, [Secondhand Goods](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=8.&chapter=9.&part=&lawCode=BPC); Florida [Chapter 538](https://www.leg.state.fl.us/Statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0538/0538.html) and [§ 539.001, Pawnbroking Act](https://www.leg.state.fl.us/Statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0539/Sections/0539.001.html); New York Gen. Bus. Law art. 6-B, [Secondhand Dealers](https://www.nysenate.gov/legislation/laws/GBS/A6-B); and New York City, [Secondhand Dealer—General license requirements](https://www.nyc.gov/site/dca/businesses/license-checklist-secondhand-dealer-general.page). These examples do not establish a nationwide holding period or prove footwear is covered in every locality.
4. **Counterfeit goods and seizure/forfeiture:** 18 U.S.C. § 2320, [Trafficking in counterfeit goods or services](https://www.law.cornell.edu/uscode/text/18/2320); 18 U.S.C. § 2323, [Forfeiture, destruction, and restitution](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title18-section2323&num=0&edition=prelim); and 15 U.S.C. § 1116(d), [Civil seizure](https://www.law.cornell.edu/uscode/text/15/1116). These provide statutory/government or court processes; they do not create automatic platform forfeiture authority.
5. **ADA and WCAG:** U.S. DOJ, [Guidance on Web Accessibility and the ADA](https://www.ada.gov/resources/web-guidance/) and [Title II web rule fact sheet](https://www.ada.gov/resources/2024-03-08-web-rule/); W3C, [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/) and [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/). Applicability and legal standard should be reviewed by counsel.
6. **Password storage and session security:** OWASP, [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); OWASP, [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html); OWASP, [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
7. **PCI DSS:** PCI Security Standards Council, [PCI DSS Document Library](https://www.pcisecuritystandards.org/document_library/) and [SAQ A eligibility criteria](https://www.pcisecuritystandards.org/faq/articles/Frequently_Asked_Question/what-are-the-criteria-for-an-eligible-merchant-to-assess-compliance-using-saq-a/). Hosted elements can reduce exposure but do not by themselves determine validation scope; confirm with the acquiring bank/QSA and payment brands.
8. **Unclaimed property:** National Association of Unclaimed Property Administrators, [Holder Reporting](https://unclaimed.org/holder-reporting/); California State Controller, [Holder Reporting](https://www.sco.ca.gov/upd_rptg.html), and [California Code of Civil Procedure § 1520](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1520.). State statutes, dormancy periods, due-diligence, and filing rules differ; use each state's official holder guidance and validate instrument/state treatment with counsel or a specialist provider.
9. **U.S. Copyright Office DMCA agent designation:** [Online Service Provider Designated Agent Directory](https://www.copyright.gov/dmca-directory/); see 17 U.S.C. § 512, [Limitations on liability relating to material online](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section512&num=0&edition=prelim).
