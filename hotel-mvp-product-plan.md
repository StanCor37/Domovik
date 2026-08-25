# Hotel Occupancy & Reservation Management — Product Plan

## 1. Confirmed Requirements (no ambiguity, building as-is)

- One property, 24 rooms, one user role, desktop-first, seasonal (1 May–31 Oct).
- Calendar is **day-based**, not smena-locked. Smena is a recurring *pattern* (9 nights, configurable in Settings), not a rigid container.
- Departure day is **free**, not occupied (hotel-night logic: 1–9 July occupied, 10 July free).
- Reservation status (Prebooked / Booked / Canceled / Partially Canceled / Completed) is **separate** from Calendar Day status (only Free / Occupied). Both Prebooked and Booked occupy the calendar.
- No auto-cancellation of unpaid Prebooked reservations.
- Room 37 defaults to "not available for reservation," toggleable.
- Full Board (FB) is the default package; HB and NIGHT are manual exceptions.
- Pricing is looked up per night from the **Price List** (date × product → price per adult), populated via Excel import or manual entry — not derived from a smena-price formula. Guest-category multipliers (adult 100% / child-70% 70% / child-50% 50% / free child 0%) are applied on top of that per-night price.
- Discount % and Discount Amount are linked/bi-directional; final price is always manually overridable.
- Local tax calculated separately, per occupied night, configurable rates.
- Reservation number format `R-XXX/YY`, sequential per year.
- Cancellation never deletes records — only changes status; ledger and reservation number persist.
- Every reservation auto-creates an Outgoing Invoices Ledger row.
- Search must normalize Serbian Latin characters (č/ć→c, š→s, ž→z, đ→dj/d).
- No RBAC, no multi-property, no OTA/channel manager, no payment gateway, no accounting, no housekeeping module, no mobile app, no AI, single currency (EUR) in MVP.

## 2. Contradictions / Unclear Rules — Resolved

All six items originally flagged here have been decided with the user (2026-08-25). Final rules now live in Section 3.

## 3. Confirmed Decisions

- **HB and NIGHT pricing**: resolved — pricing comes from the Price List (section 13) per date × product, not a formula off FB. No % relationship needed.
- **Tax bracket is tracked independently per guest**, separate from the price-discount category. Each guest gets an age (drives tax bracket: adult / 7–14 / other children) and a price-category (adult / 70% / 50% / free) — the two systems are unrelated and both stored per guest.
- **Reservation number year = year the reservation is *created***, not the stay date. Matches "on Save, generate a unique reservation number."
- **Multi-smena-period stays**: moot — the Price List holds an exact price per day regardless of which smena it falls in. The smena pattern only drives calendar display and the "default smena-length selection" convenience, not pricing.
- **Room capacity is advisory only** in MVP — the system shows the room's bed count in the modal but does not block or warn on over-capacity bookings (can tighten later).
- **Partial Cancellation edits the existing reservation** (dates/guests/amount adjusted in place) and just relabels status — no record-splitting in MVP. Full audit trail (who changed what) covers the "history."
- Multiple payments per reservation: stored as a simple list (date, amount, method) rather than a single field, since the spec explicitly describes deposit + remainder + tax as separate payments.

## 4. Open Questions — Status

- ~~Deployment~~ → **Confirmed: cloud-hosted web app**, reachable from any device/browser, not tied to one PC.
- ~~Payment tracking~~ → **Confirmed: itemized payment log** — every payment recorded individually (date, amount, method), not just a single "amount paid" field.
- HB/NIGHT default pricing → **No longer applicable** — pricing comes from the Price List (section 13), populated by you directly or via Excel import, not derived from a formula.

*(Smaller open questions — check-in/out display times, whether to show a capacity warning, exact wording for statuses — we'll settle inline as we build each screen, they don't block starting.)*

## 5. Domain Model (plain-language)

- **Property** — name, contact, currency, timezone, season start/end.
- **Room** — number, floor, bed count, extra-bed capacity, description, active flag, available-for-reservation flag.
- **SmenaPeriod** — recurring annual date ranges (start, end), configurable list.
- **PriceListEntry** — one price per **date × product (FB/HB/NIGHT)**, per adult. Populated by manual entry or **bulk Excel import**, editable per day afterward. See section 13.
- **Reservation** — guest info, room, dates, guest structure (adults / 70% / 50% / free), package, pricing snapshot (base/discount/final), tax, status, reservation number, notes, audit fields.
- **Payment** — reservation reference, amount, method, date, note (what it covers: deposit / balance / tax). Confirmed: every payment is its own record, giving a full payment history per reservation.
- **LedgerEntry** — effectively a read view generated from Reservation + Payments, not a separately edited object.
- **User** — single role in MVP, still tracked for audit ("last updated by").
- **Settings** — everything in section 28 of your spec, editable.

## 6. Reservation Status ↔ Calendar Status (the core logic)

| Reservation Status | Occupies calendar? | Notes |
|---|---|---|
| Prebooked | Yes | No deposit yet; still blocks the room |
| Booked | Yes | Deposit paid |
| Canceled | No | Room released; record kept |
| Partially Canceled | Yes, for the *remaining* dates only | Original dates released, new (shorter) dates occupy |
| Completed | No (stay is in the past) | Historical only |

Calendar cell is purely **Free / Occupied**, derived live from whichever reservations currently occupy that room/date. Visual distinction between Prebooked/Booked/Canceled/etc. lives in the *styling* of the reservation block (color + border/icon), never as a separate calendar-day state — exactly as you specified.

## 7. Price Calculation (worked example)

Reservation: 2 Adults, 1 Child-70%, dates 1–9 July (9 nights), FB. Each night's price is looked up from the **Price List** (section 13) for that exact date + FB; in this example every night in the range happens to carry the same €40/adult rate.

```
nightly adult price   = €40 (from Price List, per night — can differ night to night)
adult total            = 2 × 9 × €40        = €720
child-70% total         = 1 × 9 × €40 × 0.70 = €252
base amount             = €972
discount (e.g. 10%)     = €97.20
final accommodation     = €874.80
local tax (2 adults×9d×€1 + 0)              = €18
full amount due         = €892.80
```
User can override the final number at any point; discount % and € stay linked and recalculate live.

## 8. Occupancy / Conflict Logic

- A room/night is "taken" if any Prebooked or Booked reservation covers it.
- Departure night is never counted as taken (10 July free if guest leaves 10 July).
- On Save or Edit: check every night in the requested range against existing reservations for that room; if any night collides, block save, name the conflicting reservation, and show its dates.

## 9. Screens (MVP)

1. **Calendar** — rooms × days grid, sticky headers, smena boundaries marked, click/drag to select, click-to-open reservation modal, color-coded blocks.
2. **Reservation Modal** — guest info, guest structure + package per category, live price calc, discount, payments, status, notes, save/cancel/delete(=cancel).
3. **Dashboard** — today's arrivals/departures/occupied/free/cleaning list, next-7-days view, season occupancy %, revenue snapshot.
4. **Outgoing Invoices Ledger** — table view of every reservation's financials, searchable/sortable/filterable, opens the reservation.
5. **Settings** — property, rooms, season, smena pattern, price list, packages, child rules, tax, payment methods.
6. **User Management** — minimal, single role.

## 10. Tech Approach (confirmed)

- **Cloud-hosted web app** — reachable from any browser/device (reception PC, home, phone), no local install. Built with a standard, reliable stack: React-based frontend, a small backend, and a real database (not Excel-fragile).
- Single database, single tenant — no need for anything fancy like multi-tenant architecture, queues, or microservices.
- Hosted on an always-on web host so the app is always reachable at one address.
- This keeps things upgradeable later (e.g., if you ever want a second property or a mobile app) without a rebuild.

## 11. Suggested Build Phases

| Phase | Scope | Complexity |
|---|---|---|
| 1 | Data model + Settings (rooms, season, smena) | Simple–Medium |
| 1b | Price List module (auto-generate + per-day override grid) | Medium |
| 2 | Calendar (read-only grid, correct occupancy rendering) | Medium |
| 3 | Reservation create/edit modal + price engine + conflict check | Complex |
| 4 | Reservation statuses, cancellation flow, payments | Medium |
| 5 | Dashboard | Simple |
| 6 | Ledger (search/filter/export) | Simple–Medium |
| 7 | Search with Serbian normalization | Simple |
| 8 | Polish: sticky scrolling, today-jump, styling pass | Medium |

## 12. Notable Edge Cases to Handle

- Same-day turnover (departure + new arrival, same room) — must not read as a conflict.
- Reservation edited to overlap itself (should not false-positive against its own original booking).
- Price List: a date range in a reservation that includes a day with **no price entered yet** — the modal must flag this clearly rather than silently pricing it as €0.
- Year rollover for reservation numbering (R-0XX/26 → R-001/27).
- Partially Canceled reservation shortened to zero nights — should this just become Canceled? (worth deciding once we build that screen)
- Room 37 toggled available mid-season with existing "unavailable" assumption baked into old calendar views.
- Price List: editing a smena boundary or FB base price after individual days have already been manually overridden — regenerating shouldn't silently wipe manual overrides (needs a confirmation step, e.g. "regenerate un-overridden days only" vs "regenerate everything").

## 13. Price List Module

Replaces the simpler "seasonal price list" from the original spec's Settings section with a more flexible day-by-day structure, per your request.

**Structure**: one row per calendar day within the season, one column per product (FB / HB / NIGHT), value = price per adult per night.

**Workflow**:
1. The Price List starts **empty** — no auto-generated values.
2. You populate it either by **importing an Excel file** (bulk, fast — matches how you already work today) or by **typing prices directly into the grid** day by day.
3. **Excel import** — you'll download a template with columns `Date, FB, HB, NIGHT`, fill it in (or export it from your existing spreadsheet with matching columns), and upload it. The system validates: dates fall within the configured season, prices are valid numbers, no duplicate dates. On import, you'll be asked whether to **replace all** existing entries or **only fill in missing days** (so a partial re-upload doesn't wipe prices you already set manually).
4. After import, any single day can still be **hand-edited** in the grid for one-off changes (e.g., a late price bump for a specific date).
5. Reservations always use the exact date's stored price for the chosen product — if a date has no price entered yet, the reservation modal will flag it so you're never guessing.

**UI**: a spreadsheet-style grid (scrollable by month), an "Import from Excel" button with the replace/fill-gaps choice, and a "Download template" link so the expected format is always one click away.

**Still true from the original spec**: the final reservation price remains manually overridable regardless of what the Price List says — this module only supplies the *default suggestion*, not the final say on any individual booking.
