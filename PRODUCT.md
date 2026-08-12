# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fieldnote is primarily for its creator and a small circle of friends. Each person uses a private account to keep day-to-day health and money records understandable across web sessions.

## Product Purpose

Fieldnote brings health tracking and personal money tracking into one web product. It should make frequent logging quick enough to sustain, preserve trustworthy history, and help a person understand what needs attention today as well as how habits and spending are changing over time.

Health use covers meals, calories and macros, workouts, planning, targets, body weight, and progress. Money use covers expenses, category budgets, income, recurring bills, calendars, and multi-month statistics.

Success means a user can record ordinary events with little friction, see an accurate current-day or current-month picture, and return later to history that still reflects what was true at the time.

## Positioning

Fieldnote combines private health and money tracking in one web app. Its distinguishing mechanism is a single personal record for two everyday domains that are usually split across products, while keeping the experience focused on the individual rather than a social feed or shared financial system.

## Operating Context

- Fieldnote is a mobile-first web app.
- A Supabase session is required before personal records are shown or edited; offline operation is not a product goal.
- The interface is in English. User-entered foods, exercises, transaction details, profile names, and bill names accept Spanish and other Unicode text without translation or filtering.
- Money amounts currently use Bolivianos.
- Health and Money are separate modules inside the same app. The optional device lock protects the Money module with the browser's platform authenticator when a secure context and compatible device are available.
- Health activity is organized by local calendar date. Money activity is organized by full transaction date and calendar month.

## Capabilities and Constraints

- Health capabilities include meal and macro logging, custom foods, workout templates, set and rest tracking, completed-workout archives, workout planning, goals, dated weight entries, and progress statistics.
- Money capabilities include dated expenses, quick favorites, editable income and category limits, recurring bills, historical calendars, category drill-down, and six-month statistics.
- Supabase is the sole durable source of truth. Email-and-password authentication and Row Level Security restrict each user to their own row. Account creation signs the user in immediately without a confirmation email while this remains a small private product.
- Browser state may update optimistically, but the UI must expose saving, saved, and retry states and must never claim an unconfirmed write succeeded.
- Concurrent cloud writes must be version-checked; a stale session must surface a conflict instead of silently overwriting a newer record.
- Daily rollover must prevent meals and set completion from leaking into a new day. Historical expenses, goals, and completed workouts must retain their original dates and context.

## Brand Commitments

- The product name is Fieldnote.
- The voice is concise, practical, and privacy-conscious.
- Health and money must remain first-class parts of the same product, while preserving clear separation between their records and tasks.

## Evidence on Hand

- The runnable React/Vite implementation in `src/` demonstrates the current health and money workflows.
- `README.md` documents the product areas, privacy model, and verification commands.
- `tests/core.test.js` covers core date, migration, rollover, and month-isolation behavior.
- `design-src/Fieldnote.dc.html` is an incumbent visual reference, not product proof.
- Seeded people, foods, workouts, transactions, budgets, and statistics are demonstration data. No testimonials, customer claims, benchmarks, or other external proof are currently on hand and future work must not present them as real.

## Product Principles

1. Keep personal health and financial records private and understandable.
2. Make repeated daily logging fast, legible, and forgiving enough to become routine.
3. Preserve historical integrity across date changes, goal changes, migrations, and future persistence changes.
4. Treat health and money as one personal system while keeping each domain easy to scan and operate independently.
5. Respect the language people naturally use for their own foods, exercises, expenses, and names.
