# ARCHITECTURE.md — System Architecture & Design Specification

Welcome to the architectural specification for **Ration**. This document details the software topology, component lifecycles, and design guarantees across mobile and web platforms.

---

## 1. System Topology

```
                  +--------------------------------+
                  |         @ration/types          |
                  |  Shared Contracts & Zod Schemas|
                  +---------------+----------------+
                                  |
                +-----------------+-----------------+
                |                                   |
                v                                   v
   +------------------------+          +------------------------+
   |      apps/mobile       |          |        apps/web        |
   | Expo React Native App  |          | Vite React Dashboard   |
   +------------------------+          +------------------------+
```

### Key Architectural Tenets:

1. **Serverless / Client-First Architecture:**  
   Ration operates as a client-first application supporting mobile and web platforms without an active centralized backend server.
2. **Contract-Driven Design:**  
   All entity models, validation rules, and input DTOs originate in `@ration/types`. No domain types are duplicated in client applications.
3. **Design System Consistency:**  
   Colors, radii, and spacing tokens mirror across mobile and web runtimes, anchored around the high-contrast yellow-black palette (`#0a0a0b` canvas, `#ffe500` signal yellow primary accent).
4. **Resilient Internationalization:**  
   Bilingual translation (English and Indonesian) is enforced at build and lint time, preventing raw UI string leaks.

---

## 2. Monorepo Organization

```
ration/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # PR Quality Gate (Biome + Invariants + Vitest)
│   │   └── build-apk.yml          # Android Release Compilation & Signing
│   └── pull_request_template.md   # Standardized PR submission template
├── .pi/
│   ├── extensions/
│   │   ├── audit.ts               # Autonomous forensic resilience sweeps
│   │   ├── discuss.ts             # Conversational read-only design partner
│   │   ├── plan-mode/             # Plan mode & execution tracking (/plan, /todos)
│   │   └── pr.ts                  # Autonomous PR generation & rebase
│   ├── skills/
│   │   └── antislop/              # Anti-slop design & copywriting skill
│   ├── themes/
│   │   └── tokyo-night.json       # Pi interactive terminal theme
│   └── settings.json              # Pi configuration (pi-open-tui, Tokyo Night)
├── apps/
│   ├── mobile/                    # Expo React Native mobile client
│   │   ├── assets/                # App icons, splash screens, and adaptive drawables
│   │   ├── src/
│   │   │   ├── components/        # Mobile UI components (CalendarGrid, CycleHeader, KeypadModal, etc.)
│   │   │   ├── i18n/              # Mobile localization dictionary & hook
│   │   │   ├── theme/tokens.ts    # Mobile Steamer Porcelain design tokens
│   │   │   ├── utils/             # Budget calculation, storage & formatting engines
│   │   │   └── App.tsx            # Mobile application entry point
│   │   └── app.json               # Expo build & android metadata
│   └── web/                       # Vite React web application
│       ├── src/
│       │   ├── components/        # Web UI components (CalendarGrid, CycleHeader, KeypadDrawer, etc.)
│       │   ├── i18n/              # Web localization dictionary & hook
│       │   ├── theme/tokens.ts    # Web Steamer Porcelain design tokens
│       │   ├── utils/             # Budget calculation & formatting engines
│       │   ├── App.tsx            # Web application dashboard
│       │   └── main.tsx           # Web entry point
│       └── vite.config.ts         # Vite bundler configuration
├── packages/
│   └── types/                     # Shared Zod schemas & domain types
│       └── src/index.ts
├── scripts/
│   ├── generate-assets.js         # Mobile launcher icon and splash PNG asset generator
│   └── verify-invariants.js       # Architectural invariant validator
├── tests/
│   └── audit/                     # Domain forensic audit test suites
│       ├── contracts.test.ts      # Schema boundary validation tests
│       └── i18n.test.ts           # Translation parity audit tests
├── biome.json                     # Biome linting & formatting configuration
└── package.json                   # Root workspace manifest
```

---

## 3. Automated CI/CD Pipelines

### 3.1 CI Quality Gate (`.github/workflows/ci.yml`)

Runs on all pull requests and pushes targeting `master` and `develop`:
1. **Biome Check:** Code formatting, linting rules, and unused import elimination.
2. **Invariant Verifier:** AST scan blocking emojis, redundant non-directive comments, and untranslated string literals.
3. **Forensic Audit Suites:** Vitest domain sweeps ensuring complete schema resilience and translation parity.

### 3.2 Android APK Compilation (`.github/workflows/build-apk.yml`)

Triggered automatically on version tags (`v*`) or manual workflow dispatch:
- Executes clean Expo prebuild before Gradle initialization to prepare native build roots.
- Caches Gradle dependencies and C++ compilation (`ccache`) across runs for Hermes and TurboModules.
- Assembles release `.apk` binaries via Gradle with `--build-cache` targeting device architectures (`arm64-v8a`, `armeabi-v7a`).
- Decodes base64-encoded release keystores from GitHub Actions secrets.
- Verifies and signs binaries using Android SDK `apksigner`.
- Automatically publishes release assets to GitHub Releases.
