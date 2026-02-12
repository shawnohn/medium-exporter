# CLAUDE.md - Medium to Markdown Exporter

## Project Overview
Chrome Extension (Manifest V3) that exports Medium articles to clean, Obsidian-compatible Markdown.
Users click the extension icon on a Medium article, then copy markdown to clipboard or download as `.md`.

## Tech Stack
- **Build:** Vite + @crxjs/vite-plugin v2
- **Language:** TypeScript (strict mode)
- **UI:** Plain HTML + CSS (no framework)
- **Conversion:** Turndown v7 (bundled locally)
- **Target:** Chrome Extension Manifest V3

## Architecture

### Three Components
1. **Content Extractor** (`src/content/extractor.ts`) — Injected into Medium pages on demand via `chrome.scripting.executeScript({ func })`. Extracts article HTML + metadata. Must be self-contained (no imports at runtime).
2. **Background Service Worker** (`src/background/service-worker.ts`) — Message router. Handles tab injection and file downloads. No DOM access.
3. **Popup** (`src/popup/`) — User-facing UI. Runs Turndown conversion (needs DOM). Handles clipboard copy directly.

### Message Flow
```
Popup opens → EXTRACT → Background → injects extractor → returns { metadata, articleHtml }
Copy click → popup calls navigator.clipboard.writeText() directly (no message needed)
Download click → DOWNLOAD_FILE → Background → chrome.downloads.download
```

### Why Turndown runs in Popup (not Service Worker)
Turndown requires a DOM (`document`). Service workers have no DOM. The popup has a full DOM context.

## Directory Structure
```
medium-exporter/
├── CLAUDE.md
├── PRD.md
├── Implementation Task list.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── manifest.json
├── public/icons/           # 16/32/48/128px PNGs
└── src/
    ├── shared/
    │   ├── types.ts        # Shared interfaces (ArticleMetadata, ExportOptions, etc.)
    │   ├── messages.ts     # Typed message protocol (EXTRACT, DOWNLOAD_FILE)
    │   ├── converter.ts    # Turndown config + custom rules
    │   └── frontmatter.ts  # YAML frontmatter builder
    ├── content/
    │   └── extractor.ts    # Self-contained extractArticle() function
    ├── background/
    │   └── service-worker.ts
    └── popup/
        ├── popup.html
        ├── popup.css
        └── popup.ts        # Orchestrator: UI state, conversion, copy, download
```

## Key Conventions

### Extractor Must Be Self-Contained
`extractArticle()` is passed to `chrome.scripting.executeScript({ func })`, which serializes the function. It CANNOT reference:
- Imported modules (only type-only imports allowed, erased at compile time)
- Variables outside the function scope
- Closures

All extraction logic (Medium detection, metadata parsing, HTML cleaning) must live inside this single function.

### Metadata Extraction Priority
1. JSON-LD (`<script type="application/ld+json">`)
2. Meta tags (`og:title`, `article:published_time`, etc.)
3. DOM fallback (`document.title`, `<link rel="canonical">`, etc.)

### Content Cleaning Strategy
- Use semantic selectors (`button`, `aside`, `[role="button"]`, `svg`) over brittle class names
- Be conservative: better to leave minor noise than strip article content
- Medium's DOM changes over time; class names are unreliable

### Turndown Custom Rules
- Fenced code blocks with language detection from `class="language-xxx"`
- `<figure>` with `<figcaption>` → `![alt](src)` + italic caption
- Image toggle support: strip `<img>` when images disabled
- Post-processing: collapse 3+ newlines to 2, trim trailing whitespace

### Filename Format
`YYYY-MM-DD - article-title-slug.md` (slugified, max 80 chars)

## Permissions
- `activeTab` — access current tab on user interaction only
- `scripting` — inject extractor function
- `clipboardWrite` — clipboard access
- `downloads` — file download trigger

No `content_scripts` in manifest (on-demand injection only). No `host_permissions`.

## Dependencies
```
Runtime:    turndown ^7.2.0
Dev:        @crxjs/vite-plugin ^2.0.0
            @types/chrome ^0.0.287
            @types/turndown ^5.0.5
            typescript ^5.6.0
            vite ^6.0.0
```

No `turndown-plugin-gfm` — not needed for MVP. Custom rules handle code blocks and figures.

## Build Commands
```bash
npm run dev     # Vite dev server with HMR, outputs to dist/
npm run build   # Production build (tsc + vite build)
```

## Loading in Chrome
1. `chrome://extensions/` → Enable Developer mode
2. Click "Load unpacked" → select `dist/` directory
3. CRXJS provides auto-reload during `npm run dev`

## Design Principles
- Fully local: no external API calls, no telemetry, no data persistence
- Minimal permissions: `activeTab` over broad host permissions
- No over-engineering: no framework for a simple popup, no GFM plugin for basic rules
- Conservative cleaning: semantic selectors over brittle class names
- Error visibility: all failures surface as user-facing messages in the popup

## Error Handling
- Non-Medium page → "This does not appear to be a Medium article page."
- Extraction failure → specific error from extractor
- Clipboard failure → "Clipboard write failed."
- Download failure → "Download failed: {reason}"
- All errors shown in popup status area with `.error` styling

## Implementation Order
1. Project scaffold (package.json, tsconfig, vite config, manifest, icons)
2. Shared types and message protocol
3. Content extractor (extractArticle function)
4. Background service worker (EXTRACT + DOWNLOAD_FILE handlers)
5. Popup UI (HTML + CSS + TS orchestrator)
6. Turndown converter + frontmatter builder
7. Error handling and polish

## Testing
Manual QA — load extension, test on:
- Standard Medium article
- Article with code blocks (verify fenced blocks + language)
- Article with images (verify toggle works)
- Article with lists and blockquotes
- Member-only article (partial content)
- Non-Medium page (verify error)
- Paste result into Obsidian (verify rendering)
