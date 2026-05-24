# Multi-Tenant Public Booking System

Add a public, white-label booking flow accessible at `/booking/:slug` for each salon, while keeping the existing salon dashboard intact.

## 1. Data Model Extensions (localStorage, tenant-isolated)

Extend `SalonAccount` (in `src/types/auth.ts`) with:
- `slug: string` — unique URL identifier (e.g. `neyohair`)
- `branding: { logoUrl?, bannerUrl?, primaryColor?, secondaryColor?, description?, location?, hours? }`
- `bookingSettings: { autoConfirm: boolean; allowGuest: boolean; slotDurationMin: number }`

Auto-generate slugs from salon name on creation; ensure uniqueness in `src/lib/auth.ts`.

New global (non-tenant) index: `bf_slug_index` → `{ slug: salonId }` lookup so public booking page can resolve salon by slug without auth.

New tenant storage key `STORAGE_KEYS.STAFF` for staff list (id, nom, services[], horaires).

Public bookings go into the existing `RENDEZ_VOUS` tenant store with `source: 'public'` and `statut: 'en_attente'` (or `confirme` if auto-confirm enabled). Add `customerName`, `customerPhone`, `customerEmail`, `reference` fields to `RendezVous`.

## 2. Public Routing (no auth)

In `src/App.tsx`, add public route BEFORE the `SalonGuard` block:
```
/booking/:slug              → BookingLanding
/booking/:slug/book         → BookingFlow (multi-step)
/booking/:slug/confirmation/:ref → BookingConfirmation
```

Wrap public routes in a `PublicSalonProvider` that resolves slug → salon and injects branding CSS variables (`--primary`, `--accent`) onto a scoped wrapper, so the page automatically inherits salon colors. Show 404 page if slug unknown.

## 3. Customer Booking Flow Components

New folder `src/components/booking/`:
- `BookingLanding.tsx` — hero with banner, logo, name, description, location, hours, CTA
- `BookingFlow.tsx` — stepper container managing state across steps
- `steps/ServiceStep.tsx` — list services with price/duration
- `steps/StaffStep.tsx` — optional staff picker or "any available"
- `steps/DateTimeStep.tsx` — calendar + time-slot grid computed from existing `useRendezVous` + staff schedules, blocking taken slots
- `steps/CustomerStep.tsx` — name/phone/email/notes form (zod validated)
- `steps/ConfirmStep.tsx` — review + submit
- `BookingConfirmation.tsx` — success screen with reference, salon info, "Add to Calendar"

Mobile-first, premium soft UI using existing design tokens + injected salon colors. Framer-motion step transitions.

## 4. Salon-Side Additions

- `src/pages/BookingSettings.tsx` (sub-tab in Paramètres) — edit slug, branding (logo upload via data URL, colors, banner, description, hours, location), toggle auto-confirm, copy public booking URL with QR code.
- `src/pages/RendezVous.tsx` — add filter/badge for "Nouvelles demandes" (public bookings pending approval) with Approve/Reject actions; new in-app notification when a public booking arrives (polling localStorage on focus / storage event).
- Staff management section in Paramètres for the staff picker.

## 5. PWA / Notifications

Existing PWA config already covers installability. Booking pages reuse the same manifest so customers can "Add to Home Screen" from any `/booking/:slug` URL. Add per-salon dynamic `<title>` and `<meta theme-color>` via a small `useSalonHead` hook so the installed shortcut feels salon-branded.

Notification stub: write to `NotificationContext` when a new public booking is detected; future SMS/WhatsApp/email channels left as TODO hooks in `src/lib/notifications.ts`.

## 6. Validation & Isolation

- Zod schemas for customer step.
- Slug regex `^[a-z0-9-]{3,30}$`, uniqueness enforced.
- Public page reads ONLY the resolved salon's tenant data; no cross-tenant access.
- Guest bookings allowed; optional customer account layer deferred (note left in code) — keep it lean for now.

## Technical notes

- Pure frontend / localStorage (per project memory: Node.js backend pending, no Supabase). All new APIs added to `src/lib/api.ts` as async stubs for future backend swap.
- French + English strings added to `src/lib/translations.ts`.
- FCFA currency throughout.
- No new heavy deps; reuse shadcn, date-fns, framer-motion, recharts already installed. Add `qrcode.react` for the share-QR.

## Out of scope for this pass
- Real-time push notifications (architecture ready, not wired)
- Customer accounts with login (guest only for now, with TODO)
- Actual SMS/WhatsApp delivery (manual Copy & Open flow per existing policy can be added next pass)
