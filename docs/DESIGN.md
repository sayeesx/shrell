# VAHN AUTOMOTIVE — DESIGN DIRECTION & SPECIFICATION (DESIGN.md)

**Brand Identity**: VAHN Automotive (India)  
**Positioning**: Precision-engineered automotive accessories, touring equipment, and technical interior enhancements.  
**Philosophy**: Industrial discipline, technical clarity, and zero decorative excess. Inspired by precision motorsport engineering and European industrial design.

---

## 1. Visual Dials (Anti-Slop Calibration)

- **ENERGY**: 2 / 3 (Disciplined, deliberate, high-end technical restraint. No hyperactivity, no sterile emptiness).
- **RHYTHM**: 2 / 3 (Content-driven variations between editorial product showcases, technical spec matrices, and catalog listings).
- **MOTION**: 2 / 3 (Crisp mechanical transitions: 150ms-220ms ease-out, zero bouncy cartoonish physics, full `prefers-reduced-motion` compliance).

---

## 2. Color System & Contrast Verification

All text combinations strictly meet or exceed **WCAG AA (4.5:1 minimum, 7:1+ for primary text)**.

### Dark Surface Foundation (Primary Storefront & Admin Canvas)
- **Canvas Base (`bg-surface-950`)**: `#0B0D11` (Deep technical obsidian)
- **Surface Layer 1 (`bg-surface-900`)**: `#12161E` (Panel and card foundation)
- **Surface Layer 2 (`bg-surface-800`)**: `#1A202C` (Elevated modals, dropdowns, hovered items)
- **Surface Border (`border-surface-700`)**: `#283244` (Crisp 1px hairline technical borders)
- **Divider Subdued (`border-surface-800`)**: `#1E2636`

### Typography Tones
- **Text Primary (`text-slate-100`)**: `#F1F5F9` (Contrast ratio > 14:1 against `#0B0D11`)
- **Text Secondary (`text-slate-400`)**: `#94A3B8` (Contrast ratio > 5.8:1 against `#0B0D11` / `#12161E`)
- **Text Muted / Metadata (`text-slate-500`)**: `#64748B` (Contrast ratio > 4.5:1 for labels and auxiliary specs)

### Technical Accent (Single Deliberate Accent)
- **Performance Ochre / Machined Amber**: `#D97706` (Primary accent) / `#F59E0B` (Hover / Focus ring)
  - Used strictly for: Primary action buttons, active compatibility status badges, and critical focus indicators.
  - Never used as a full-page gradient, glow wash, or casual decorative stripe.

### Semantic Status Indicators
- **In Stock / Verified (`text-emerald-400`, `bg-emerald-950/40`, `border-emerald-800`)**: `#34D399`
- **Low Stock / Warning (`text-amber-400`, `bg-amber-950/40`, `border-amber-800`)**: `#FBBF24`
- **Out of Stock / Critical (`text-rose-400`, `bg-rose-950/40`, `border-rose-800`)**: `#F87171`
- **Technical Info / Blueprint (`text-cyan-400`, `bg-cyan-950/40`, `border-cyan-800`)**: `#22D3EE`

---

## 3. Typography Hierarchy

- **Primary Typeface**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, sans-serif. Clean, geometric, neutral, high legibility.
- **Technical & SKU Monospace**: `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`, monospace. Used for part numbers, VIN/vehicle specs, prices, timestamps, and inventory codes.
- **Scale**:
  - `H1 / Display`: `clamp(1.875rem, 4vw, 2.75rem)` (30px-44px), tracking `-0.025em`, font weight 700.
  - `H2 / Section Title`: `clamp(1.5rem, 3vw, 2rem)` (24px-32px), tracking `-0.02em`, font weight 600.
  - `H3 / Card Header`: `1.25rem` (20px), font weight 600.
  - `Body Regular`: `0.9375rem` (15px), line height `1.6`, font weight 400.
  - `Technical Label / SKU`: `0.75rem` - `0.8125rem` (12px-13px), uppercase, tracking `+0.05em`, font weight 500, tabular numbers.

---

## 4. Spacing, Borders, and Elevation

- **Corner Radii**:
  - Micro controls (Badges, tags): `4px` (`rounded`)
  - Inputs, Buttons: `6px` (`rounded-md`)
  - Cards, Panels, Modals: `8px` (`rounded-lg`)
  - No ubiquitous full-pill buttons (`rounded-full` is restricted strictly to circular icon-only buttons or status pips).
- **Hairlines**: High-precision 1px borders (`border border-surface-700/80`).
- **Shadows**: Restrained elevation. Ground-plane matte finish. Shadows are reserved exclusively for floating dropdowns, sticky action bars, and modal overlays (`shadow-xl shadow-black/50`).

---

## 5. Interaction & Affordances

- **Cursor Pointer**: Applied globally to all clickable buttons, links, select triggers, and checkbox wrappers.
- **Focus Indicators**: Always visible 2px outline in `#F59E0B` with `2px` offset (`outline-2 outline-offset-2 outline-amber-500`).
- **Tap Targets**: Minimum 44px x 44px on all touch surfaces across mobile breakpoints (320px to 430px).
- **Micro-interactions**: Subtle scale or background shift (150ms). Zero bouncing, wobbling, or excessive physics.

---

## 6. Prohibited Anti-Slop Patterns (Strict Compliance)

1. **NO em dashes (`—`)** in user-facing marketing copy or descriptions (governed by R-02). Use commas, colons, or periods.
2. **NO fake social proof, AI testimonial avatars, or generic statistics** (R-17, R-18, R-36).
3. **NO generic marketing buzzwords** ("Next Generation", "Revolutionary", "AI Powered").
4. **NO multi-colored rainbow gradients or floating glass orbs** (R-01).
5. **NO non-functional placeholder buttons** (R-26). Every button has an active route, handler, or documented modal.
6. **NO unverified claims or fake delivery dates** (R-38).
