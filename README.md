# Ciney

Ciney is a React + Vite front end for browsing TMDB movies and TV shows and launching the configured player.

## Product memory

Persistent Firestick product goals and roadmap are tracked in:

- `FIRESTICK_PRODUCT_MEMORY.md`

## Setup

1. Install dependencies:
   - `npm install`
2. Start the dev server:
   - `npm run dev`
3. Open the local URL shown in the terminal.

## Best local playback test

For player testing, use:

- `npm run dev:no-debug`

This starts Vite in a separate PowerShell window and opens the site in a normal browser session so the Visual Studio browser debugger does not pause external player scripts.

## Environment

Create a local `.env` file with:

- `VITE_TMDB_API_KEY`
- `VITE_PLAYER_BASE_URL`
- `VITE_PLAYER_ALLOWED_ORIGIN`
- `VITE_PLAYER_SOURCE_BASES` (optional, comma-separated fallback base URLs)
- `VITE_GITHUB_REPO` (optional, for update checks and release helper)
- `VITE_APP_VERSION` (optional, for update checks)

## Release sanity check

Run this before shipping:

- `npm run sanity:release`

## Playback note for Visual Studio

If the player freezes while debugging in Visual Studio, the browser debugger is likely pausing inside the external player script.

Use one of these options:

- Start the site without browser script debugging
- Use `npm run dev:no-debug`
- Use **Ctrl+F5** instead of **F5**
- Keep the provided `.vscode/launch.json` skip rules so external player scripts are skipped

The default watch flow launches the embedded player inside the site and keeps a subtle fallback option only if the player stalls.

## Downloader-friendly APK releases

A GitHub Actions workflow is included at:

- `.github/workflows/android-build.yml`

On every push to `main`, it:

1. installs Node and Java 21
2. sets up the Android SDK
3. runs `npm install`
4. runs `npm run sanity:release`
5. runs `npm run build`
6. runs `npm run android:sync`
7. runs `./gradlew assembleDebug`
8. publishes `app-debug.apk` to a GitHub Release named **Latest Firestick Build**

### Required GitHub secrets

Set these repository secrets before using the workflow:

- `VITE_TMDB_API_KEY`
- `VITE_PLAYER_BASE_URL`
- `VITE_PLAYER_ALLOWED_ORIGIN`

### Direct download link for Downloader

After the action runs:

1. open your GitHub repo
2. go to **Releases**
3. open **Latest Firestick Build**
4. right-click `app-debug.apk`
5. choose **Copy Link Address**

That copied asset link is the direct download URL that Downloader can use without requiring a login for public repositories.

### Automatic short-link helper

You can generate a short Downloader-friendly URL with:

- `npm run get-link`

Before running it, set either:

- `VITE_GITHUB_REPO=owner/repo`
- or `GITHUB_REPO=owner/repo`

The helper script will:

1. query the latest GitHub release
2. find `app-debug.apk`
3. shorten the release asset URL using TinyURL
4. print a large Firestick-friendly link box in the console
