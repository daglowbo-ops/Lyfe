---
name: Fieldnote
description: A grounded night fieldbook for personal health and money.
colors:
  field-green: "oklch(0.84 0.15 135)"
  work-amber: "oklch(0.84 0.15 55)"
  ledger-blue: "oklch(0.84 0.15 245)"
  signal-red: "oklch(0.76 0.16 30)"
  parchment-ink: "#e9e5dc"
  charcoal-page: "#0d0d0c"
  outer-night: "#080807"
  hero-surface: "#1a1a17"
  panel-surface: "#111110"
  sheet-surface: "#141412"
typography:
  display:
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
    fontSize: "64px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-3.5px"
  headline:
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-1px"
  title:
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.9px"
  body:
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "1.6px"
rounded:
  chip: "12px"
  field: "13px"
  action: "14px"
  panel: "20px"
  hero: "22px"
  sheet: "26px"
  shell: "44px"
spacing:
  tight: "4px"
  compact: "8px"
  control-gap: "10px"
  content-gap: "14px"
  cluster: "18px"
  surface-padding: "20px"
  section: "26px"
components:
  button-field:
    backgroundColor: "{colors.field-green}"
    textColor: "#0d1a0c"
    typography: "{typography.body}"
    rounded: "{rounded.action}"
    padding: "0 20px"
    height: "52px"
    width: "100%"
  button-work:
    backgroundColor: "{colors.work-amber}"
    textColor: "#14100a"
    typography: "{typography.body}"
    rounded: "{rounded.action}"
    padding: "0 20px"
    height: "52px"
    width: "100%"
  button-ledger:
    backgroundColor: "{colors.ledger-blue}"
    textColor: "#08131f"
    typography: "{typography.body}"
    rounded: "{rounded.action}"
    padding: "0 20px"
    height: "56px"
    width: "100%"
  chip-selected:
    backgroundColor: "{colors.parchment-ink}"
    textColor: "{colors.charcoal-page}"
    rounded: "{rounded.chip}"
    padding: "0 15px"
    height: "44px"
  chip-idle:
    backgroundColor: "transparent"
    textColor: "rgba(233,229,220,0.65)"
    rounded: "{rounded.chip}"
    padding: "0 15px"
    height: "44px"
  card-hero:
    backgroundColor: "{colors.hero-surface}"
    textColor: "{colors.parchment-ink}"
    rounded: "{rounded.hero}"
    padding: "22px 20px 18px"
  panel:
    backgroundColor: "{colors.panel-surface}"
    textColor: "{colors.parchment-ink}"
    rounded: "{rounded.panel}"
    padding: "18px"
  input:
    backgroundColor: "{colors.charcoal-page}"
    textColor: "{colors.parchment-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "46px"
---

# Design System: Fieldnote

## Overview

**Creative North Star: "The Night Fieldbook"**

Fieldnote should feel like a well-used personal fieldbook opened after dark: private, grounded, and ready for practical work. Warm near-black pages carry compact layers of information, while parchment-toned type and small color marks make the record feel human rather than clinical.

The system favors grounded utility over spectacle. Large quantities are immediately legible, exact labels stay quiet, controls feel tactile, and depth is ambient rather than glossy. The interface should remain calm even when it is dense; it is a working instrument for repeated daily use, not a gamified fitness product or a polished fintech showroom.

**Key Characteristics:**

- Warm near-black surfaces with parchment-toned text.
- Sparse domain color: green for nutrition, amber for training, blue for money, red for warnings.
- Outfit carries hierarchy; JetBrains Mono carries labels, dates, and exact values.
- Compact mobile density with generous touch targets and layered, ambient depth.
- Tactile controls, precise state changes, and minimal blur.

## Colors

The **Field & Ledger** palette uses warm neutrals as the page and reserves chromatic color for meaning.

### Primary

- **Field Green** (`colors.field-green`): nutrition targets, successful health states, progress, and health-specific actions.

### Secondary

- **Work Amber** (`colors.work-amber`): training, workout progress, rest timers, and training actions.

### Tertiary

- **Ledger Blue** (`colors.ledger-blue`): money totals, spending actions, budget progress, and financial state.
- **Signal Red** (`colors.signal-red`): destructive actions, overspend, and warnings only.

### Neutral

- **Parchment Ink** (`colors.parchment-ink`): primary text, active navigation, selected neutral controls, and focus rings.
- **Charcoal Page** (`colors.charcoal-page`): the application canvas and inset field background.
- **Outer Night** (`colors.outer-night`): the wide-screen surround behind the phone shell.
- **Hero Surface** (`colors.hero-surface`): the lifted, high-priority summary cards.
- **Panel Surface** (`colors.panel-surface`): supporting statistics, budget rows, and secondary containers.
- **Sheet Surface** (`colors.sheet-surface`): modal bottom sheets.

**The Domain Signal Rule.** Each accent is semantic: green is nutrition, amber is training, blue is money, and red is warning. Never exchange them for decoration.

**The Sparse Color Rule.** Accents appear on labels, indicators, progress, and decisive actions; warm neutrals carry the rest of the interface.

## Typography

**Display Font:** Outfit (with system-ui and sans-serif fallbacks)

**Body Font:** Outfit (with system-ui and sans-serif fallbacks)
**Label/Mono Font:** JetBrains Mono (with ui-monospace and monospace fallbacks)

**Character:** Outfit gives the fieldbook a plainspoken, contemporary voice with softly rounded forms. JetBrains Mono turns dates, categories, measurements, and compact captions into precise annotations without making the whole product feel technical.

### Hierarchy

- **Display** (600, 64px, 1 line-height, -3.5px tracking): the single dominant quantity in a hero card.
- **Headline** (600, 30px, 1.1 line-height, -1px tracking): screen titles.
- **Title** (600, 26px, 1.15 line-height, about -0.9px tracking): workout names and major in-screen subjects.
- **Body** (400-500, 14-16px, about 1.35 line-height): rows, descriptions, labels for direct actions, and supporting copy.
- **Label** (400-500, 12px, 1.1-1.6px tracking, uppercase): dates, sections, categories, units, and status captions.
- **Numeric annotation** (JetBrains Mono, 11-16px, 400-600): amounts, macros, dates, set counts, and editable values.

**The Two-Register Rule.** Use Outfit for reading and hierarchy; use JetBrains Mono for annotation, measurement, navigation labels, and compact status.

**The One-Giant-Number Rule.** A screen region gets at most one display-scale quantity. Supporting values step down sharply so the primary measure remains unmistakable.

## Layout

Fieldnote is mobile-first and intentionally preserves a handset composition. On narrow screens, the app occupies the full viewport. At the wide-screen frame breakpoint (460px wide and 720px high), the same composition sits inside a 402px shell up to 874px tall; it does not expand into a desktop dashboard.

Every screen uses 20px horizontal page edges. Content begins below the floating module switch with safe-area-aware top clearance and ends above the tab bar with safe-area-aware bottom clearance. Repeated vertical rhythm clusters controls at 8-18px, separates surfaces by 14-20px, and opens new sections with 26px. Dense data uses explicit grids: seven columns for calendars and weekly summaries, two or three columns for supporting metrics, and fixed measurement columns where alignment matters.

**The One-Phone Rule.** Wider viewports frame the mobile instrument; they do not stretch, reflow, or decorate it into a separate desktop product.

**The Twenty-Pixel Edge Rule.** Primary screen content holds a consistent 20px inset. Internal component padding may vary, but page edges do not drift.

## Elevation & Depth

The system is layered and ambient. Hero cards lift from the page with a soft, compact shadow (`0 10px 28px rgba(0,0,0,.38)`) and a warm-ink hairline. Supporting panels stay flat, separated by tonal surface shifts and low-alpha borders. On wide screens, the phone shell receives the deepest ambient shadow (`0 40px 80px rgba(0,0,0,.35)`) plus a one-pixel warm outline.

Blur is an edge treatment, not a material system. The module switch and bottom navigation use restrained background translucency with 16-18px backdrop blur; modal scrims use only a 3px blur. Cards, fields, and panels remain opaque.

### Shadow Vocabulary

- **Hero lift** (`0 10px 28px rgba(0,0,0,.38)`): high-priority summary cards only.
- **Shell ambient** (`0 40px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(233,229,220,.06)`): the framed phone on wide screens.

**The One-Lift Rule.** Hero cards may float; supporting panels stay flat and rely on tone, borders, and spacing.

**The Blur-at-the-Edges Rule.** Backdrop blur belongs only to navigation, switching, and modal scrims; it never becomes the default card material.

## Shapes

Forms are rounded enough to feel handled, never bubbly. Chips use 12px corners, fields 13px, actions 14px, supporting panels 18-20px, hero cards 22px, and sheets 26px at their exposed top edge. The wide-screen shell uses a 44px radius. Circular geometry is reserved for avatars, status dots, toggle thumbs, and compact add actions.

Borders are thin warm-ink hairlines, usually at 6-16% opacity. Dashed borders are reserved for additive affordances and empty states. Repeated nested elements step their radii down by roughly 2-4px so controls sit naturally inside larger surfaces.

**The Nested Radius Rule.** Inner controls must be visibly tighter than their parent surface; never stack identical large radii into a soft, inflated blob.

## Components

Components should feel **tactile and controlled**: generous targets, quiet rest states, obvious selection, and brief physical feedback.

### Buttons

- **Shape:** full-width primary actions use 14-16px corners and 52-56px height; compact controls preserve at least a 44px target.
- **Primary:** use the owning domain accent with dark domain ink, 600 weight, and no shadow.
- **Hover / Focus / Active:** hover brightens slightly; active compresses to 97.5%; keyboard focus uses a 2px Parchment Ink outline with a 3px offset.
- **Secondary / Ghost:** transparent or low-alpha warm-ink fill with a 12-14% border. Hover strengthens the border and text without adding elevation.
- **Destructive:** Signal Red with dark red-brown ink; reveal through a deliberate delete action or swipe affordance.

### Chips

- **Style:** 40-44px tall with 12-13px corners, 15px horizontal padding, medium Outfit text, and a 14% warm-ink border.
- **State:** selected neutral filters invert to Parchment Ink on Charcoal Page. Domain selection may use the owning accent when the choice itself is domain-specific.

### Cards / Containers

- **Corner Style:** hero cards use the 22px hero radius; supporting panels use 18-20px.
- **Background:** hero cards use Hero Surface; secondary structures use Panel Surface or a 4-7% Parchment Ink tint.
- **Shadow Strategy:** only hero cards use hero lift; ordinary rows and panels remain flat.
- **Border:** 6-16% Parchment Ink depending on hierarchy.
- **Internal Padding:** 18-22px, tightened only for compact data rows.

### Inputs / Fields

- **Style:** Charcoal Page fill, Parchment Ink text, 12-14% warm-ink border, 13-14px corners, and 46-56px height.
- **Typography:** prose inputs use Outfit; exact numbers and amounts use JetBrains Mono.
- **Focus:** the global 2px Parchment Ink outline sits 3px outside the field.
- **Disabled:** reduce opacity while preserving label and value legibility; do not erase the control.

### Navigation

The module switch floats at the top as a compact two-state capsule. The selected module inverts to Parchment Ink on Charcoal Page. Bottom navigation stays translucent and blurred, uses handcrafted geometric icons, and pairs them with 12px monospaced labels. Active items use full Parchment Ink; inactive items retain readable contrast against the charcoal page.

### Bottom Sheets

Sheets rise from the bottom with a 26px top radius, opaque Sheet Surface, a subtle warm border, a short drag handle, and a blurred dark scrim. They close through the visible Done action, the scrim, or Escape. Sheet motion uses a 340ms weighted ease; reduced-motion preference removes it.

### Meters and Steppers

Meters are 3-5px capsules with domain-colored fill on a low-alpha track. Steppers pair monospaced values with 44px minus/plus targets inside a 46px, 13px-radius field. State motion should communicate progress or touch response, never decorate idle content.

**The Tactile State Rule.** Every interactive component gets one clear response—brightness, border, inversion, compression, or movement—without stacking effects.

## Do's and Don'ts

### Do:

- **Do** use Field Green, Work Amber, Ledger Blue, and Signal Red only for their established semantic roles.
- **Do** preserve warm near-black layers and parchment-toned type instead of introducing cool black, pure white, or generic gray surfaces.
- **Do** maintain 20px page edges, compact section rhythm, and touch targets around 44px or larger.
- **Do** pair large Outfit quantities with small JetBrains Mono annotations.
- **Do** keep blur at the navigational edges and keep cards, panels, and fields opaque.
- **Do** honor `prefers-reduced-motion` by removing entry animation and reducing transitions to near-instant state changes.

### Don't:

- **Don't** use excessive glassmorphism, translucent content cards, glowing panes, or blur as the default surface treatment.
- **Don't** spread domain accents across large decorative areas or interchange their meanings.
- **Don't** turn the framed wide-screen view into a multi-column desktop dashboard.
- **Don't** add shadows to ordinary rows, controls, or secondary panels.
- **Don't** replace precise labels and values with playful badges, gamified rewards, or ornamental illustrations.
