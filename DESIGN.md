---
name: Go-Stop Scoreboard
description: A Korean game-night score ledger that makes every point visible.
colors:
  felt: "#123c32"
  felt-deep: "#0c3028"
  felt-light: "#1f5748"
  sheet: "#f4f4e9"
  sheet-bright: "#fcfcf4"
  ink: "#172c25"
  muted: "#687a6e"
  line: "#d5ddcd"
  lime: "#d6f55f"
  vermilion: "#d74432"
  gold: "#f0bd38"
typography:
  display:
    fontFamily: '"Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
    fontSize: "clamp(26px, 3vw, 34px)"
    fontWeight: 760
    letterSpacing: "-0.065em"
  body:
    fontFamily: '"Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  square: "0"
spacing:
  tight: "8px"
  standard: "16px"
  section: "24px"
  open: "36px"
components:
  button-primary:
    backgroundColor: "{colors.felt}"
    textColor: "{colors.sheet-bright}"
    rounded: "{rounded.square}"
    padding: "0 17px"
    height: "50px"
  input-count:
    backgroundColor: "{colors.sheet-bright}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    height: "36px"
---

# Design System: Go-Stop Scoreboard

## Overview

**Creative North Star: "The Game-Night Score Ledger"**

The interface treats the scores as a shared record at the edge of a Korean game table. A deep green field frames pale, ruled sheets; lime and vermilion marks distinguish each player's score, important multipliers, and actions. The forms stay square and legible, like a scorekeeper's working surface rather than a decorative game skin.

The calculator's central promise is visible arithmetic for everyone at the table. Each player's card counts, assumptions, base points, and multipliers stay together in a simultaneous entry sheet, so the round does not require switching between player tabs. The atmosphere comes from color, ruled divisions, and custom tally marks—not from ornamental card art or hidden scoring rules.

**Key Characteristics:**
- Green tabletop surrounding a pale scoring sheet
- Square, ruled controls and score groups
- Bold Korean system typography with tabular score figures
- Lime for the active path; vermilion for multipliers and cautions

## Colors

The palette pairs deep tabletop greens with a light, slightly green-tinted sheet and a small set of vivid scorekeeper marks.

### Primary
- **Table Felt** (#123c32): Main working field, navigation, and primary record action.
- **Deep Felt** (#0c3028): Page surround and deepest edge of the table.
- **Raised Felt** (#1f5748): Hover and interactive emphasis on the green field.

### Secondary
- **Score Lime** (#d6f55f): Active player, selected state, and the primary action arrow.
- **Signal Vermilion** (#d74432): Multiplier emphasis and destructive-action affordances.
- **Score Gold** (#f0bd38): Gwang marker and a restrained category cue.

### Neutral
- **Ledger Sheet** (#f4f4e9): Main score-entry surface.
- **Bright Sheet** (#fcfcf4): Inputs and live calculation surface.
- **Score Ink** (#172c25): Primary text on pale surfaces.
- **Muted Ink** (#687a6e): Supporting labels and instructions on the sheet.
- **Rule Line** (#d5ddcd): Divisions between score groups and calculations.

### Named Rules
**The Visible Arithmetic Rule.** Keep category points and applied multipliers inspectable beside the resulting total.

## Typography

**Display Font:** System UI stack (`"Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`)
**Body Font:** The same system UI stack, with local Korean glyph coverage.
**Label/Mono Font:** No separate monospace face; figures use tabular numerals.

**Character:** Compact, direct Korean labels carry the task, while weight and size create hierarchy without a decorative display face. Totals use tabular figures so they remain stable as counts change.

### Hierarchy
- **Display** (760, `clamp(26px, 3vw, 34px)`): Page title.
- **Headline** (760, 23px): Active player's entry heading and live total.
- **Title** (760, 14–17px): Score categories, history, and controls.
- **Body** (400, 13px, 1.5 line-height): Instructions and explanatory copy.
- **Label** (650–700, 9–12px): Counts, states, and score breakdowns.

## Layout

The page is a centered table with a maximum width of 1440px and fluid side padding. A cumulative scoreboard sits above a list of player entry sheets; all players remain visible together, and each sheet keeps that player's counts and live result together. One shared round-commit action records every player's result at once, followed by a five-round settlement when due. Entry sheets form two columns at viewport widths of 1100px and above, with each panel's calculation below its entry fields. Narrow screens at 720px and below stack the sheets and keep two score groups per row. A 390px breakpoint tightens controls for the smallest phones. On coarse-pointer tablets, count controls and major actions expand to at least 44px touch targets. Safe-area insets are respected.

## Elevation & Depth

The composition is mostly flat: the green field and pale sheet are separated by contrast and crisp ruled edges. A single offset shadow lifts the two working sheets from the tabletop without turning each control into a floating card.

### Shadow Vocabulary
- **Working sheet** (`0 14px 36px rgb(4 25 20 / 22%)`): The entry and live-result sheets against the green field.

## Shapes

Controls and sheets use square corners (`0` radius). Thin rules separate content; custom category markers use small diamonds, circles, ribbons, and capsules so the scoring groups remain distinct without requiring color alone.

## Components

### Buttons
- **Shape:** Square corners; no pill buttons.
- **Primary:** Table Felt (#123c32) with bright-sheet text; 50px minimum height on desktop and 56px on coarse-pointer tablets.
- **Hover / Focus:** The primary shifts to Raised Felt; keyboard focus uses a visible 3px vermilion outline with offset.
- **Secondary:** Transparent text buttons use a thin rule and stay visually subordinate.
- **Destructive:** Reset and player removal remain visibly separate and require confirmation.

### Inputs / Fields
- **Style:** Square count controls on Bright Sheet, framed by a thin Rule Line; numerals are centered and tabular.
- **Focus:** A visible 3px vermilion outline with offset.
- **Interaction:** Plus and minus controls accompany editable numeric fields; count changes update the total immediately.

### Player Sheets
- Each player has one visible sheet with their name, running total, category counts, and live breakdown.
- New players appear in the same list; no tab selection is needed to switch input ownership.
- One shared action records the whole round for all players; every fifth round displays a score-only settlement with explicit transfers.

### Cards / Containers
- **Entry sheet:** Ledger Sheet with ruled score groups and a custom marker per category.
- **Live result:** Bright Sheet with base points and a multiplier line.
- **Round commit:** A single full-width action records the displayed scores for every player together.
- **Settlement:** A ruled score summary lists the five-round totals and exact point transfers; it does not imply a universal currency conversion.
- **History:** An untruncated, reverse-chronological ruled log on the tabletop; each row opens its saved date, card counts, category points, and multipliers.

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
- **Don't** add decorative card illustrations, gradients, or rounded card grids that compete with score entry.
