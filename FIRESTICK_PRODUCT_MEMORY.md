# Ciney Firestick Product Memory

## Product Goal
Build Ciney as a stable, TV-first, Netflix-like Firestick streaming app with smooth D-pad navigation, reliable playback, and clean production UI.

## Hard Requirements (Persistent)
- TV-first UX (Leanback style): large focus states, safe-zone overlays, no desktop-style interactions.
- Reliable player behavior on Fire OS WebView.
- Continue Watching must persist and resume correctly.
- Remove debug/dev surfaces from production playback flow.
- APK release flow must produce installable updates from GitHub Actions.

## Current Architecture
- Frontend: React + Vite.
- TV navigation: `@noriginmedia/norigin-spatial-navigation`.
- Android shell: Capacitor WebView (`MainActivity`).
- Player source: Vidking embed URL with bridge handling.

## Implemented Baseline
- Vidking URL builder for movie/tv routes with progress support.
- WebView playback settings tuned for Firestick.
- JS bridge for `PLAYER_EVENT` forwarding and malformed-message safety.
- Throttled progress persistence and resume behavior.
- Auto-hide controls and recovery actions in player overlay.
- GitHub Actions Android build + release automation.
- CI debug keystore caching for more stable install/update behavior.

## Execution Plan (Active)

### Phase 1 — Stabilize playback + TV recovery (current)
- [x] Remove fragile forced player query defaults that can cause unavailable pages.
- [x] Keep native bridge and fullscreen/back handling stable.
- [x] Add in-app Retry/Source 2 recovery actions (no external player link dependency).
- [x] Add simple in-app telemetry event logging for playback failures (non-PII).

### Phase 2 — Netflix-like UI hardening
- [x] Overscan-safe control overlays (5% safe-zone behavior).
- [x] Strong high-contrast focus states for TV controls.
- [x] Smart buffering overlay + control auto-hide behavior.
- [x] Improve episode rail focus choreography and animation timing.

### Phase 3 — Release confidence
- [x] Keep CI-generated APK updates installable by stabilizing debug keystore usage.
- [x] Add smoke verification checklist to release body.
- [x] Add pre-release sanity script (env + asset checks).

### Phase 4 — Native player migration
- [x] Design bridge-to-native ExoPlayer migration path (`docs/EXOPLAYER_MIGRATION_PLAN.md`).
- [x] Introduce API-managed playback sources (source base list abstraction in frontend).
- [ ] Move from iframe-first to native playback-first architecture.

## Release Verification Checklist
- Android workflow run is green on latest `main` commit.
- Released asset includes `app-release.apk`.
- TinyURL resolves to that exact APK asset.
- Clean install works on Firestick.
- In-app watch flow starts playback and receives progress events.
- Back button and D-pad controls behave correctly.
