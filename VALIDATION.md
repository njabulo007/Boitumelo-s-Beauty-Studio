# Validation record

Verified in the cloud workspace on 17 October 2026.

- `npm ci` and `npm --prefix firebase/functions ci`: completed from their committed lockfiles.
- `npm run build`: TypeScript and production Vite build passed.
- `npm test`: 13 domain tests passed (shared prices, automatic offer expiry, incompatible offer handling, category propagation, owner-only commands, customer history selection, reward rules, duplicate submissions, corrections and audit reasons).
- `npm run test:e2e`: 11 Chromium browser tests passed (public navigation, modal/lightbox, missing-contact feedback, image fallback, shared price changes, offer preview/publication/ending, registration/sign-in/sign-out/reset explanation, owner/customer demo separation, five-visit reward and redemption, categories/gallery/reset, upload validation/compression/persistence/deletion, reduced motion, keyboard entry, and overflow checks at 360/390/768/1440 px).
- `npm --prefix firebase/functions run build`: reference trusted functions type-checked successfully. The current machine uses Node 24; functions target Node 22 for future runtime validation.
- Development server started on port 5173. Actual public, customer and owner flows exercised in Chromium. Desktop and mobile screenshots inspected; system fonts were replaced with locally bundled fonts and image fallbacks were verified.

## Confirmed limitations

The environment proxy returned HTTP 403 for the design reference and `images.unsplash.com`. No original reference branding, images or code were copied. Linked stock image content could not be verified here; the public design and lightbox were checked using their explicit error fallbacks, and local uploaded images were exercised. The required image and reference domains were saved in the environment configuration draft; saving does not apply or publish that policy.

No Firebase project, real customer account, reset email, cloud deployment, billing, emulator, deployed security rule or live function invocation was created or validated. Demo role checks are local simulation, not a production security boundary. See FIREBASE_SETUP.md for the remaining integration and enforcement tests. No real appointments, booking confirmations, payments or pilot performance results are claimed.

Reusable install/startup instructions and network additions were saved as an environment draft. Publication/restoration in a new cloud task has not been tested. No Git commit, push or application deployment was performed.
