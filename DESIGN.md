---
name: Go-Stop Scoreboard
description: An iPadOS-inspired Korean Go-Stop scorekeeper with readable live totals.
colors:
  felt: "#0066cc"
  felt-deep: "#f2f2f7"
  felt-light: "#0056b3"
  sheet: "#ffffff"
  sheet-bright: "#ffffff"
  ink: "#1d1d1f"
  muted: "#636366"
  line: "#d1d1d6"
  lime: "#ffcc00"
  vermilion: "#c62828"
  gold: "#ffcc00"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif'
    fontSize: "clamp(42px, 4.2vw, 52px)"
    fontWeight: 760
    letterSpacing: "-0.03em"
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  square: "0"
  soft: "12px"
  card: "22px"
spacing:
  tight: "8px"
  standard: "16px"
  section: "24px"
  open: "36px"
components:
  button-primary:
    backgroundColor: "{colors.felt}"
    textColor: "{colors.sheet-bright}"
    rounded: "{rounded.soft}"
    padding: "0 17px"
    height: "64px"
  input-count:
    backgroundColor: "{colors.sheet-bright}"
    textColor: "{colors.ink}"
    rounded: "{rounded.soft}"
    height: "44px"
---

# Design System: Go-Stop Scoreboard

## Overview

**Creative North Star: "The Native Scorekeeper"**

The interface feels at home on an iPad: a quiet system-gray canvas, crisp white grouped panels, familiar system-blue actions, and the platform's native Korean system font. Neutral surfaces keep long sessions calm; a few semantic colors distinguish card categories without turning the scorekeeper into a toy.

The calculator's central promise is visible arithmetic for everyone at the table. Each player's card counts, assumptions, base points, and multipliers stay together in a simultaneous entry sheet, so the round does not require switching between player tabs. The atmosphere comes from clean color-coded groups, friendly score marks, and quick tap targets—not from ornamental card art or hidden scoring rules.

**Key Characteristics:**
- iPadOS-style grouped layout on a light system-gray canvas
- White score sheets, fine separators, and soft rounded controls
- Large native Korean system typography with tabular score figures
- System blue for actions, with restrained category and warning colors

## Colors

The palette pairs iOS system gray and white with familiar blue actions and a restrained set of category colors.

### Primary
- **System Blue** (#0066cc): Main record action, active states, and go-count cue.
- **System Gray** (#f2f2f7): Page surround and calm reading field.
- **Raised Blue** (#0056b3): Hover and interactive emphasis.

### Secondary
- **System Yellow** (#ffcc00): Gwang marker and small highlights.
- **System Red** (#c62828): Multiplier emphasis and destructive-action affordances.
- **System Green** and **System Blue**: Distinct category markers.

### Neutral
- **Score Sheet** (#ffffff): Main entry and live calculation surface.
- **Score Ink** (#1d1d1f): Primary text on light surfaces.
- **Muted Ink** (#636366): Supporting labels.
- **Rule Line** (#d1d1d6): Divisions between score groups and calculations.

### Named Rules
**The Visible Arithmetic Rule.** Keep category points and applied multipliers inspectable beside the resulting total.

## Typography

**Display Font:** Native iPad/OS system stack (`-apple-system`, `"Apple SD Gothic Neo"`, `"Malgun Gothic"`, `"Noto Sans KR"`, sans-serif)
**Body Font:** The same locally available system stack, with Korean glyph coverage and no remote font dependency.
**Label/Mono Font:** No separate monospace face; figures use tabular numerals.

**Character:** Korean labels use an 18px body baseline and a strong size/weight ladder; totals use tabular figures so they remain stable as counts change.

### Hierarchy
- **Display** (780, `clamp(42px, 4.2vw, 52px)`): Page title.
- **Headline** (760, 23px): Active player's entry heading and live total.
- **Title** (760, 14–17px): Score categories, history, and controls.
- **Body** (400, 18px, 1.5 line-height): Instructions and explanatory copy.
- **Label** (650–700, 14–18px): Counts, states, and score breakdowns.

## Layout

The page is a centered table with a maximum width of 1440px and fluid side padding. A cumulative scoreboard sits above a list of player entry sheets; all players remain visible together, and each sheet keeps that player's counts and live result together. One shared round-commit action records every player's result at once, followed by a five-round settlement when due. iPad Pro landscape at 1024px and above uses two player columns; each sheet keeps its live calculation below its counts. At 950px and below, each player's live result moves below their counts; narrow screens at 720px and below stack the player sheets, and phones at 560px and below show one score group per row. On coarse-pointer tablets, count controls and major actions expand to at least 44px touch targets. Safe-area insets are respected.

## Elevation & Depth

The composition is mostly flat: the system-gray canvas and white sheets are separated by contrast and crisp ruled edges. A single soft offset shadow lifts the working sheets without turning every control into a floating card.

### Shadow Vocabulary
- **Working sheet** (`0 8px 24px rgb(29 29 31 / 8%)`): Entry and live-result sheets against the light canvas.

## Shapes

Controls use soft 12px corners and player sheets use 22px corners. Thin rules separate content; custom category markers use diamonds, circles, ribbons, and capsules so the scoring groups remain distinct without relying on color alone.

## Components

### Buttons
- **Shape:** Soft 12px corners; no pill buttons.
- **Primary:** System Blue (#0066cc) with white text; 64px minimum height.
- **Hover / Focus:** The primary shifts to Raised Blue; keyboard focus uses a visible 3px system-blue outline with offset.
- **Secondary:** Transparent text buttons use a thin rule and stay visually subordinate.
- **Destructive:** Reset and player removal remain visibly separate and require confirmation.

### Inputs / Fields
- **Style:** Rounded count controls on white sheets, framed by a thin Rule Line; numerals are centered and tabular.
- **Focus:** A visible 3px system-blue outline with offset.
- **Interaction:** Plus and minus controls accompany editable numeric fields; count changes update the total immediately.

### Player Sheets
- Each player has one visible sheet with their name, running total, category counts, and live breakdown.
- New players appear in the same list; no tab selection is needed to switch input ownership.
- One shared action records the whole round for all players; every fifth round displays a score-only settlement with explicit transfers.

### Cards / Containers
- **Entry sheet:** White Score Sheet with ruled score groups and a custom marker per category.
- **Live result:** System-gray panel with base points and a multiplier line.
- **Round commit:** A single full-width action records the displayed scores for every player together.
- **Settlement:** A ruled score summary lists the five-round totals and exact point transfers; it does not imply a universal currency conversion.
- **History:** An untruncated, reverse-chronological log in a clear white panel; each row opens its saved date, card counts, category points, and multipliers.

### Signature Component
- **Live calculation:** Shows the player's current total, each category's points, and the named go/Meongtta multipliers before the shared round action is enabled.

## Do's and Don'ts

### Do:
- **Do** keep scoring assumptions visible and editable.
- **Do** keep every player's running total visible above the simultaneous entry sheets.
- **Do** keep each player's counts and live result together, with one clear action to commit everyone's round scores.
- **Do** show the five-round settlement's scoring basis and transfer direction without implying a cash value.
- **Do** keep touch actions at least 44px on coarse-pointer tablet screens.

### Don't:
- **Don't** imply one universal house-rule set.
- **Don't** hide category arithmetic behind a single unexplained total.
- **Don't** hide a player's inputs behind a tab or require switching players to enter the same round.
- **Don't** add decorative card illustrations or rounded-card grids that compete with score entry.
