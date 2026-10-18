# Boitumelo’s Beauty Salon

A responsive Customer & Service Validation pilot for Khulisa Media, built with React 19, TypeScript, Vite and Tailwind CSS 4. No payments, till, confirmed bookings or deployment are included.

## Preview

```sh
npm ci
npm run dev -- --port 5173
```

Open the development server in your usual local browser or supported editor preview. Routes: `/#home`, `/#services`, `/#gallery`, `/#offers`, `/#contact`, `/#rewards`, `/#owner`.

- **Public website:** service categories, sample prices, automatic offer date filtering, gallery filters/lightbox, rewards introduction and contact information.
- **My Rewards:** register with synthetic information and a demo-only password, sign in/out, explore the sample customer, edit your profile and view visit/reward history. Demo password reset explains that no email is sent. Live reset uses the prepared Firebase Auth adapter.
- **Owner’s space:** click **Open owner dashboard**. Manage services, categories, offers and pictures; search customers; record completed visits; redeem rewards; correct visits with a reason; inspect the audit and overview. Mobile navigation is behind the menu icon.
- **Reset:** Owner dashboard → Settings → Reset workspace data → Confirm.

This is a local demonstration. Owner entry is intentionally open, not a secure production sign-in. Everything, including demo password hashes, is visible to somebody with browser storage access. **Never enter real personal information or a reused password.** Demo state uses localStorage; the active role uses sessionStorage. Browser sessions do not synchronise, and audit records are not tamper-proof. The app does not silently switch between demo and live data.

## Checks

```sh
npm run typecheck
npm test
npm run build
npx playwright test
npm --prefix firebase/functions ci
npm --prefix firebase/functions run build
```

Browser tests use `/usr/bin/chromium`; override `CHROMIUM_PATH` if yours is elsewhere. Tests run the dev server automatically if needed. Firebase functions target Node 22. They can be type-checked on the environment’s Node 24; use Node 22 for emulator/deployment validation.

## Content and visual identity

- `src/data/content.ts`: central sample business configuration, starting services, photos, source labels and loyalty rules.
- `src/styles.css`: CSS variables for the ivory/charcoal/sage/blush palette and serif/sans typography. Tailwind is installed through the Vite plugin; CSS supplies the editorial compositions.
- Fonts are bundled locally from Fontsource (Cormorant Garamond and DM Sans; SIL Open Font License in their packages).
- `src/services/model.ts`: pure shared-content and loyalty operations. Customer views select only the active demo identity; owner commands check the demo role and use idempotency tokens for visits/redemptions.
- `src/services/demo.ts`: browser persistence, demo credentials, image compression and local measurement.
- `src/services/firebase.ts`: separate explicit Firebase adapter. It is not connected to the demo UI.

Photos are temporary direct Unsplash image URLs, used under the [Unsplash licence](https://unsplash.com/license). They are labelled illustrative, **not the salon’s work**. URL, alt text, category, source, caption and placeholder flags are centralised and owner-editable. The hero prioritises its image; below-fold photos lazy-load, have fixed aspect ratios and responsive URL sizes. All images have a visible error fallback. Replace with salon-owned or properly licensed photos before launch. Source image identifiers are preserved in their original URLs.

The inspiration reference `https://demos.spasalonweb.com/nailstudio/` was blocked by this environment’s proxy, so the supplied provisional editorial direction was used. No reference images or code were copied. The environment also currently blocks `images.unsplash.com`; fallbacks were checked. Allow that domain in environment settings to see the linked photographs. Bundled fonts work without Google Fonts access.

## Rules and limitations

The interface omits demo banners and sample labels at the owner’s request; the underlying local-only architecture is unchanged. The configured address is 13074 Lehole Street, Tsakane, Brakpan. Initial services, prices, offers and rewards remain starter content pending owner approval. Set confirmed WhatsApp (international digits), hours and address using `.env.local` based on `.env.example`. Until a valid number is present, enquiry buttons show an unavailable message and never open a broken contact link. With a number, messages mention the selected service/offer; they are enquiries, not bookings.

Sample rewards: every five owner-recorded completed visits earns 20% off one treatment. No expiry, no cash value, one reward per treatment, subject to owner approval. Change the central policy and trusted backend policy together before launch. Customers cannot record visits or redeem rewards. Retries of the same owner submission do not duplicate visits/rewards; distinct confirmations intentionally represent distinct completed visits. Corrections retain the original visit and reason; a correction cannot invalidate an already redeemed reward.

Promotion input dates mean South African calendar days (UTC+2). Active promotions are computed from timestamps; regular prices return after expiry. An open homepage refreshes time-sensitive content every 30 seconds. Published offers linked to archived services are hidden. Reducing a regular price to an offer’s price or below automatically ends that offer and records the reason in the audit. Price edits do not imply approved real prices.

Uploaded images accept JPG/PNG/WebP up to 8 MB, decode and compress to at most 1,200 px, and are size-checked before local storage. Browser quota failures preserve the previous saved state and display an error. Images linked to offers cannot be removed until those offers use another photo.

Analytics remain separate from profile records and store only an event name, timestamp and approved content subject. No name/email/customer ID is included. Metrics describe the selected period, except total registered profiles which is explicitly all-time. Returning customers means two or more recorded visits in that period. Local browser data is incomplete, resets erase it, repeated page views count individually, and only the latest 2,000 events are retained. Enquiry clicks, bookings and completed visits are never conflated; there is no booking count or invented conversion/retention rate.

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for the live integration boundary and launch prerequisites. No cloud resources, billing, security rules or deployment have been activated.
