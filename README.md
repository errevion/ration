# Ration

Ration is a daily spend tracker engineered to keep personal finances calibrated against monthly pay cycles. Instead of retroactive expense logging, Ration computes real-time daily spending allowances, redistributing unspent funds and new income dynamically across remaining cycle days.

---

## Monorepo Architecture

The repository is structured as an npm workspaces monorepo:

- `apps/mobile`: Expo React Native mobile application for Android and iOS.
- `apps/web`: Vite React mobile-first web dashboard.
- `packages/types`: Shared domain contracts, entity types, and Zod validation schemas.
- `tests/audit`: Automated forensic test suites for contracts, budget computations, and translation parity.
- `scripts`: Architectural invariant verification tooling.

---

## Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- Expo Go app (optional, for physical mobile testing) or Android Studio / Xcode for emulators

---

## Getting Started

### 1. Installation

Clone the repository and install all dependencies from the root directory:

```bash
git clone https://github.com/errevion/ration.git
cd ration
npm install
```

### 2. Development

You can run either the mobile app or the web application independently:

#### Run Mobile Client (Expo)

```bash
npm run dev:mobile
```

- Press `a` in the terminal to launch on an Android emulator or connected device.
- Press `i` to launch on an iOS simulator.
- Press `w` to open the web version via Expo.
- Scan the displayed QR code with the Expo Go mobile application.

#### Run Web Client (Vite)

```bash
npm run dev:web
```

The application will be served locally at `http://localhost:5173`. When testing in browser developer tools, enable mobile device emulation.

---

## Building for Production

### Web Build

Compile the web production bundle:

```bash
npm --workspace=apps/web run build
```

The output artifacts will be generated in `apps/web/dist/`.

### Android Release APK

Production Android builds are compiled and signed automatically through GitHub Actions (`.github/workflows/build-apk.yml`) on Git version tags (`v*`).

For local compilation:

```bash
cd apps/mobile
npx expo run:android --variant release
```

---

## Quality Gates and Verification

All code changes must pass Biome linting, formatting, architectural invariant checks, and Vitest domain audit sweeps before submission.

### Run All Checks

```bash
npm run check
```

This runs:
1. Biome format and linting verification across the entire monorepo.
2. Invariant verifier blocking emojis, redundant comments, and untranslated string literals.

### Run Audit Test Suites

```bash
npm run test:audit
```

To run individual audit domains:

```bash
# Verify shared Zod contracts and schema boundaries
npm run audit:contracts

# Verify 100% translation key parity between English and Indonesian dictionaries
npm run audit:i18n
```

---

## Core Features and Interaction

- **Daily Spending Allowance**: Automatically distributes remaining balances over remaining days in the active pay period.
- **Dual Balance Controls**: Record expenses (`- Spend`) or register fund top-ups (`+ Add`), recalibrating the quota immediately.
- **High-Density Calendar Grid**: Formats large currencies (such as Indonesian Rupiah) into compact metric notation (`k`, `m`, `b`) to prevent cell overflow.
- **Day Inspection**: Tap any calendar day to inspect full unrounded amounts and detailed transaction entries.
- **Settings Configuration**:
  - Switch between English (`EN`) and Indonesian (`ID`) with zero-reload parity.
  - Choose from currency presets (`Rp `, `$`, `€`, `£`, `S$`, `¥`) or enter a custom symbol.
  - Configure custom start and end cycle dates, with one-tap quick presets for calendar months or payday periods.

---

## Repository Rules

1. Domain types must always be defined in `packages/types`. Do not duplicate interfaces in client apps.
2. Design tokens from `theme/tokens.ts` must be used for colors, spacing, and radii.
3. No emojis anywhere in code, comments, documentation, or commit messages.
4. Conventional Commits format is required (`feat(...)`, `fix(...)`, `chore(...)`, `docs(...)`).
