# Native-messaging protocol (DRAFT)

Status: **undecided**. `src/shared/protocol.ts` holds a first sketch, not a
contract. This document tracks the open questions so the two repos can agree
before either commits.

## Transport

- Chrome/Safari native messaging: one host process per connected port, framed
  JSON over stdin/stdout (4-byte little-endian length prefix, handled by the
  browser).
- **Response size cap: 1 MB** (host → extension). Request cap is effectively
  unbounded. Any "list all accounts" call must paginate.
- Only extension IDs listed in the host's manifest may connect. The host binary
  identity is guaranteed by the manifest path.

## Open questions

1. **Envelope shape.** Current sketch: `{ v, id, type, payload }`. Confirm
   request/response correlation by `id`, and whether the core may push
   unsolicited events (e.g. "vault locked by timeout").
2. **Auth model.** Is the master-password unlock session the only gate, or is
   there per-request confirmation for sensitive reads (identity fields, full
   credential export)?
3. **Vault data model — clear vs. encrypted.**
   - Searchable-in-clear (candidates): site name / origin, account label,
     created/last-used timestamps, favicon.
   - Fully encrypted: passwords, identity fields (name, address, DOB, national
     ID), email addresses(?), notes.
   - Decide what the popup's "single pane of glass" list can render without an
     unlock.
4. **Fill flow.** Does the core return concrete field values keyed by selector,
   or a semantic bundle the content script maps to fields itself?
5. **Signup lifecycle.** Message set for: fill request → password generation →
   "pending account" persistence → confirmation once a later login succeeds.
6. **Error taxonomy.** Codes for: host not running, vault locked, no match,
   user declined, protocol version mismatch.
7. **Versioning.** How `v` mismatches are handled (hard fail vs. negotiate).
