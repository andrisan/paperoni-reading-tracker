# Reading Tracker Extension (`paperoni.reading-tracker`)

## Overview
Reading Tracker adds a dedicated activity to Paperoni for managing reading progress with board/list workflows and quick actions.

## Features
- Dedicated activity: `Reading Tracker`
- Activity main view + activity sidebar
- Topbar control (expanded and collapsed mount variants)
- Paper-level actions through the `paperoni` SDK
- Local extension state persistence via extension-scoped storage

## Architecture
Folder layout:

```text
exts/reading-tracker/
  manifest.json
  main.js
  esbuild.config.mjs
  package.json
  src/
    main.tsx
    state/
      dummyData.ts
      store.ts
      types.ts
    ui/
      ArchiveView.tsx
      ReadingTrackerCollapsedArea.tsx
      ReadingTrackerExtensionReservedArea.tsx
      ReadingTrackerSideBar.tsx
      ReadingTrackerView.tsx
```

Build pipeline:
- Entry: `src/main.tsx`
- Bundler: `esbuild`
- Output: `main.js` (ESM)
- External runtime import: `paperoni`

## Manifest + Capabilities
`manifest.json` is the source of truth for extension identity and runtime capabilities.

Current capabilities:
- `ui.activity.register`
- `ui.activity.view.register`
- `ui.activity.sidebar.register`
- `ui.topbar.extensionReservedArea.register`
- `paperoni.papers.read`
- `paperoni.ui.control`
- `paperoni.events.subscribe`
- `data.read`
- `data.write`

## Build / Dev Commands
From `exts/reading-tracker`:

```bash
npm install
npm run dev
```

`npm run dev` watches and rebuilds `main.js`.

Production bundle:

```bash
npm run build
```

## Local Clone-to-Install Workflow
Paperoni discovers installed extensions from:

```text
~/Library/Application Support/paperoni/extensions/<extension-id>
```

For Reading Tracker:

```text
~/Library/Application Support/paperoni/extensions/paperoni.reading-tracker
```

Workflow:
1. Clone this extension repo into that directory.
2. Ensure `manifest.json` and built `main.js` exist.
3. Run Paperoni (`npm run dev` in the app repo).
4. The extension appears as **installed** and defaults to **disabled** on first detection.
5. Enable it from the Extensions UI.

## GitHub Release Process
This repo is intended to keep generated artifacts (like `main.js`) out of `main` branch.
Releases are built from source by GitHub Actions and uploaded as release assets.

Published assets per release:
- `manifest.json`
- `main.js`
- `manifest.sha256`
- `main.sha256`

Recommended release steps:
1. Bump version in `manifest.json` and `package.json`.
2. Commit and push changes to `main`.
3. Create and push a version tag that matches manifest version (for example `v0.3.0`).

```bash
git tag -a v0.3.0 -m "Release v0.3.0"
git push origin v0.3.0
```

4. GitHub Actions workflow `.github/workflows/release.yml` builds and publishes release assets automatically.
5. Update remote catalog entry URLs + checksums.

## Catalog Entry Example

```json
{
  "id": "paperoni.reading-tracker",
  "name": "Reading Tracker",
  "version": "0.3.0",
  "description": "Track reading progress inside Paperoni.",
  "apiVersion": "1.x",
  "minAppVersion": "0.0.0",
  "capabilities": [
    "ui.activity.register",
    "ui.activity.view.register",
    "ui.activity.sidebar.register",
    "ui.topbar.extensionReservedArea.register",
    "paperoni.papers.read",
    "paperoni.ui.control",
    "paperoni.events.subscribe",
    "data.read",
    "data.write"
  ],
  "publisher": {
    "id": "paperoni",
    "name": "Paperoni",
    "kind": "paperoni"
  },
  "trust": "verified",
  "executionMode": "renderer-trusted",
  "github": {
    "repoUrl": "https://github.com/paperoni/reading-tracker"
  },
  "release": {
    "manifestUrl": "https://github.com/paperoni/reading-tracker/releases/latest/download/manifest.json",
    "mainUrl": "https://github.com/paperoni/reading-tracker/releases/latest/download/main.js"
  },
  "checksums": {
    "manifestSha256": "<manifest sha256>",
    "mainSha256": "<main sha256>"
  }
}
```

## Troubleshooting
- Extension not listed in Installed:
  - verify folder name is exactly `paperoni.reading-tracker`
  - verify both `manifest.json` and `main.js` exist
- Extension listed but blank UI:
  - rebuild (`npm run build`)
  - confirm bundle exports default extension class/definition
  - check app dev console for runtime activation errors
- Install/update from catalog fails:
  - verify release URLs are reachable
  - verify catalog checksums match exact uploaded bytes
  - verify manifest fields (`id`, `name`, `version`, `capabilities`) match catalog metadata
