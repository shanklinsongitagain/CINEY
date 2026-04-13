# ExoPlayer Migration Plan (Bridge to Native)

## Objective
Move Ciney from iframe-first playback to native ExoPlayer-first playback while preserving current Firestick UX and watch-progress behavior.

## Milestones
1. Add Android native module exposing `play(mediaId, mediaType, season, episode, progress)`.
2. Keep existing React routing/UI; replace iframe surface with native player host view.
3. Route playback URLs through a centralized API (`/playback/session`) returning signed source URLs.
4. Mirror current progress events to JS so Continue Watching remains unchanged.
5. Introduce feature flag to switch between iframe and native playback for staged rollout.

## Data Contract
- Request: `{ mediaType, id, season, episode, preferredSource }`
- Response: `{ manifestUrl, drm, subtitles, audioTracks, expiresAt }`

## Risk Controls
- Keep iframe fallback in beta builds.
- Add startup/rebuffer/error telemetry comparison between players.
- Roll out by percentage and monitor failure rates.
