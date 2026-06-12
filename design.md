---
version: alpha
name: Google
description: A clean, computationally precise interface system built around pure white surfaces, restrained elevation, soft rounded geometry, and Google's iconic multi-color identity. The experience prioritizes clarity, accessibility, whitespace, and scalable interaction patterns over decorative styling. Google Sans and Roboto create a highly neutral typographic voice designed to scale across search, productivity, AI, cloud, maps, and operating-system experiences.

colors:
  primary: "#1a73e8"
  primary-hover: "#1558b0"
  primary-soft: "#e8f0fe"
  red: "#ea4335"
  yellow: "#fbbc04"
  green: "#34a853"
  ink: "#202124"
  body: "#3c4043"
  muted: "#5f6368"
  muted-soft: "#80868b"
  hairline: "#dadce0"
  hairline-soft: "#e8eaed"
  border-strong: "#c4c7c5"
  canvas: "#ffffff"
  surface-soft: "#f8f9fa"
  surface-card: "#ffffff"
  surface-strong: "#f1f3f4"
  surface-elevated: "#ffffff"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  success: "#34a853"
  warning: "#fbbc04"
  error: "#ea4335"

typography:
  display-xl:
    fontFamily: "Google Sans, Roboto, Arial, sans-serif"
    fontSize: 64px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -1px
  display-lg:
    fontFamily: "Google Sans, Roboto, Arial, sans-serif"
    fontSize: 48px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.5px
  display-md:
    fontFamily: "Google Sans, Roboto, Arial, sans-serif"
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.25px
  display-sm:
    fontFamily: "Google Sans, Roboto, Arial, sans-serif"
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  title-md:
    fontFamily: "Google Sans, Roboto, Arial, sans-serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  title-sm:
    fontFamily: "Google Sans, Roboto, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0
  body-md:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  button-md:
    fontFamily: "Google Sans, Roboto, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  nav-link:
    fontFamily: "Google Sans, Roboto, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 72px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 10px 24px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 10px 24px
    height: 40px
  chip-filter:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  search-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: 0 24px
    height: 56px
  search-orb:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    height: 40px
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  floating-card:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  ai-prompt-card:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  footer-light:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Overview

Google is the canonical example of a computationally clean interface system designed for extreme scalability. The base canvas is **pure white** (`{colors.canvas}` — #ffffff) with soft neutral surfaces (`{colors.surface-soft}` — #f8f9fa), restrained hairlines (`{colors.hairline}` — #dadce0), and a single dominant interaction color: **Google Blue** (`{colors.primary}` — #1a73e8). Unlike expressive consumer brands that rely on gradients, shadows, or heavy visual styling, Google builds hierarchy through spacing, typography, rhythm, and whitespace.

Typography combines **Google Sans** for display hierarchy and navigation with **Roboto** for body copy and dense productivity interfaces. Display headlines stay at moderate weights (500 instead of aggressive 700+) and rely on scale rather than thickness for emphasis. Large headlines commonly sit between 36–64px while body copy remains highly readable at 14–16px.

The shape language is intentionally soft and approachable. Buttons, chips, search bars, and filters all use rounded geometry (`{rounded.full}` and `{rounded.lg}`) while maintaining a highly mathematical layout structure. Search bars are large pill-shaped containers, cards use soft 12–16px corner radii, and spacing follows strict 4px / 8px grid increments.

The interface avoids decorative depth. Elevation is subtle and functional — soft borders and low-opacity shadows create separation without becoming visually dominant. Across Search, Workspace, Gemini, Maps, Cloud, and Android marketing surfaces, the system remains structurally consistent while adapting density and layout rhythm depending on context.

**Key Characteristics:**
- Single dominant interaction color: `{colors.primary}` (#1a73e8) drives CTAs, links, focus states, and interaction highlights.
- Multi-color identity system (blue, red, yellow, green) appears mostly in branding moments rather than interface saturation.
- Google Sans + Roboto establish a neutral, scalable typographic system.
- Pill-shaped search bars (`{rounded.full}`) are one of Google's strongest visual signatures.
- Cards use soft rounded geometry (`{rounded.lg}` ~16px) with minimal elevation.
- Whitespace drives hierarchy more than shadows or gradients.
- The system prioritizes accessibility, predictability, and scalability over personality-heavy UI.
- Layout density adapts fluidly between editorial marketing pages and productivity-heavy interfaces.

## Colors

### Brand & Accent
- **Google Blue** (`{colors.primary}` — #1a73e8): The dominant interaction color. Used for primary CTAs, focused states, navigation highlights, active tabs, and inline links.
- **Google Blue Hover** (`{colors.primary-hover}` — #1558b0): Hover / pressed variant for buttons and interactive states.
- **Google Blue Soft** (`{colors.primary-soft}` — #e8f0fe): Focus backgrounds, selected chips, active filters.
- **Google Red** (`{colors.red}` — #ea4335): Error states and brand moments.
- **Google Yellow** (`{colors.yellow}` — #fbbc04): Warning states and onboarding illustration accents.
- **Google Green** (`{colors.green}` — #34a853): Success states and positive metrics.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): The primary surface for almost all Google interfaces.
- **Surface Soft** (`{colors.surface-soft}` — #f8f9fa): Secondary backgrounds, chip containers, side panels.
- **Surface Strong** (`{colors.surface-strong}` — #f1f3f4): Hover containers and utility sections.
- **Surface Elevated** (`{colors.surface-elevated}` — #ffffff): Floating dialogs and cards.

### Borders & Hairlines
- **Hairline** (`{colors.hairline}` — #dadce0): Default border and divider tone.
- **Hairline Soft** (`{colors.hairline-soft}` — #e8eaed): Lighter separators.
- **Border Strong** (`{colors.border-strong}` — #c4c7c5): Stronger outlines for focused containers.

### Text
- **Ink** (`{colors.ink}` — #202124): Headlines and primary content.
- **Body** (`{colors.body}` — #3c4043): Running text and interface copy.
- **Muted** (`{colors.muted}` — #5f6368): Metadata and inactive states.
- **Muted Soft** (`{colors.muted-soft}` — #80868b): Disabled content.

## Typography

### Font Family
The system combines **Google Sans** and **Roboto**.

- **Google Sans** handles navigation, headlines, buttons, tabs, and high-level hierarchy.
- **Roboto** handles dense body content and productivity-focused interfaces.
- The system avoids decorative typography and instead focuses on clarity and readability.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 64px | 500 | 1.05 | -1px | Hero headlines |
| `{typography.display-lg}` | 48px | 500 | 1.1 | -0.5px | Marketing section titles |
| `{typography.display-md}` | 36px | 500 | 1.15 | -0.25px | Feature section headlines |
| `{typography.display-sm}` | 28px | 500 | 1.2 | 0 | Product section titles |
| `{typography.title-md}` | 22px | 500 | 1.3 | 0 | Card titles |
| `{typography.title-sm}` | 18px | 500 | 1.35 | 0 | Secondary headings |
| `{typography.body-md}` | 16px | 400 | 1.6 | 0 | Default body copy |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Metadata and secondary copy |
| `{typography.caption}` | 12px | 400 | 1.4 | 0 | Captions and utility labels |
| `{typography.button-md}` | 14px | 500 | 1.2 | 0 | Buttons and navigation |
| `{typography.nav-link}` | 14px | 500 | 1.2 | 0 | Top navigation links |

### Principles
- Headlines rely on scale instead of aggressive weight.
- Moderate font weights create a softer and more approachable feeling.
- Large whitespace blocks establish hierarchy.
- Body copy prioritizes readability over compact density.
- Interfaces remain visually neutral to support many different product ecosystems.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.base}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 72px.
- Major sections commonly use 72px vertical rhythm.
- Productivity interfaces compress spacing density dynamically.
- Marketing pages prioritize large whitespace blocks.

### Grid & Container
- Marketing pages use centered max-width containers.
- Workspace interfaces rely on fluid adaptive layouts.
- Search experiences minimize visual chrome.
- Card systems align through strict spacing increments.

### Whitespace Philosophy
Whitespace is structural rather than decorative. Large empty regions reduce cognitive load and allow content hierarchy to emerge naturally.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, light border | Main pages and layouts |
| Soft border | 1px low-contrast divider | Cards and containers |
| Minimal shadow | Low-opacity shadow | Floating dialogs and overlays |
| Elevated surface | White card over soft surface | Menus and modals |

Google intentionally minimizes dramatic depth effects. Elevation exists to clarify interaction layers rather than create visual decoration.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Dividers and structural layouts |
| `{rounded.xs}` | 4px | Small utility elements |
| `{rounded.sm}` | 8px | Small controls |
| `{rounded.md}` | 12px | Inputs and compact cards |
| `{rounded.lg}` | 16px | Feature cards |
| `{rounded.xl}` | 24px | AI prompt cards and large surfaces |
| `{rounded.full}` | 9999px | Search bars, chips, pill buttons |

### Interface Geometry
- Search bars use full pill geometry.
- Chips and filters use soft rounded capsules.
- Cards maintain low visual noise.
- Inputs prioritize large touch targets and accessibility.

## Components

### Navigation

**`top-nav`** — A lightweight 64px navigation system with Google Sans labels, white background, and restrained interaction styling. Navigation relies on spacing rather than borders.

### Buttons

**`button-primary`** — Blue filled CTA with white text and fully rounded pill geometry (`{rounded.full}`). Used for primary actions.

**`button-secondary`** — White pill button with blue text and subtle border treatment.

### Search

**`search-bar`** — One of Google's most recognizable interface patterns. Large pill-shaped container with soft border, icon-led interaction, and spacious internal padding.

**`search-orb`** — Circular blue action element used inside compact search experiences.

### Cards

**`feature-card`** — White elevated card with 16px rounded corners, soft border, and large internal padding.

**`floating-card`** — Slightly elevated floating container used for overlays, Gemini prompts, and Workspace utilities.

### AI Surfaces

**`ai-prompt-card`** — Large soft-surface container with high whitespace density, rounded geometry, and conversational interaction styling.

### Footer

**`footer-light`** — Light gray footer region with dense navigation structure and muted text hierarchy.

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| Mobile | Navigation compresses into utility-first flows; cards stack vertically. |
| Tablet | Multi-column card systems begin appearing. |
| Desktop | Large whitespace rhythm and centered layouts become dominant. |
| Wide | Layout width caps preserve readability and hierarchy. |

## Accessibility

Google strongly prioritizes:
- keyboard navigation;
- scalable typography;
- readable contrast;
- semantic structure;
- large touch targets;
- predictable interactions;
- screen-reader compatibility.

## Known Gaps

- Internal Google products occasionally diverge from canonical Material patterns.
- Workspace products vary slightly in density and spacing.
- Gemini, Cloud, Android, and Search each introduce localized UI variations.
- Marketing pages use more expressive layouts than productivity interfaces.
