# account-singularity-extension

Browser extension for **account-singularity** — a local, single-device identity
broker. This repo is the TypeScript MV3 extension. The encrypted vault and the
native-messaging host live in the separate `account-singularity-core` repo.

The extension is a **pass-through relay only**: it detects login and signup
forms and asks the local core to fill them. No credentials or personal data are
ever stored in the extension — only non-sensitive settings in
`chrome.storage.local`.

## Layout

```
src/
  background/   service worker — owns the native-messaging port to the core
  content/      content script — form detection (MutationObserver + heuristics)
  popup/        toolbar popup — status only for now
  shared/       protocol + in-extension message types
  public/       manifest.json and generated icons, copied verbatim into dist/
scripts/        build helpers (icons, content-script bundle, dev watch, zip)
docs/PROTOCOL.md   the still-undecided native-messaging schema
```

## Build

Two builders, by necessity:

- **Vite** builds the popup and the background worker (both may be ES modules).
- **esbuild** bundles the content script as a single IIFE — content scripts
  cannot use static `import`.

```
npm install
npm run build      # → dist/ (load unpacked)
npm run dev         # both builders in watch mode
```

Load `dist/` via `chrome://extensions` → Developer mode → **Load unpacked**.
After a rebuild, hit the reload icon on the extension card.

## Safari

```
npm run safari      # build + xcrun safari-web-extension-converter
```

Requires macOS with Xcode. Produces an Xcode project under `safari/`; the same
TS/JS/manifest, wrapped — no code changes.

## Checks

```
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest
npm run check        # all of the above + prettier --check
```

## Toolchain notes

- **MV3 service worker**: killed and revived by the browser. Never assume
  in-memory state survives between events.
- **TypeScript pinned to 6.0.x** — `typescript-eslint@8` requires `<6.1.0`.
- No UI framework. Add one only if the popup grows past simple prompts.
