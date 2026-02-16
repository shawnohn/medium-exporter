# Local Development Guide

## Environment Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Google Chrome

### Install

```bash
git clone https://github.com/shawnohn/medium-exporter.git
cd medium-exporter
npm install
```

## Development Server

```bash
npm run dev
```

Starts Vite with the CRXJS plugin. The `dist/` directory is produced and the extension auto-reloads on file changes.

Load the extension once from `dist/` (see [deployment.md](deployment.md)), then changes hot-reload automatically.

## Type Checking

```bash
npx tsc --noEmit
```

Runs TypeScript in check-only mode. The project uses strict mode with Chrome API types.

## Coding Rules

### Extractor Constraints
The `extractArticle()` function in `src/content/extractor.ts` is serialized and injected into web pages. It must be:
- **Self-contained** — no module imports (type-only imports are fine)
- **No closures** — cannot reference variables outside the function
- **DOM-only** — can only use browser DOM APIs available in the page context

### Content Cleaning
- Prefer semantic selectors (`button`, `aside`, `svg`) over CSS class names
- Medium's class names change frequently — don't rely on them
- Be conservative: leaving minor noise is better than stripping article content

### Conversion
- Turndown runs in the **popup context** (not the service worker) because it requires DOM
- Custom rules are defined in `src/shared/converter.ts`
- Post-processing handles whitespace normalization

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/content/` | Content extractor (injected into pages) |
| `src/background/` | Service worker (message routing, downloads) |
| `src/popup/` | Popup UI (HTML, CSS, TypeScript) |
| `src/shared/` | Shared types, messages, converter, frontmatter |
| `public/icons/` | Extension icons |
| `docs/` | Project documentation |

## Testing

Manual QA only (no automated tests in MVP). Test on:
- Standard Medium article
- Article with code blocks
- Article with images and captions
- Article with nested lists and blockquotes
- Member-only article (partial content visible)
- Non-Medium page (should show error)
- Paste output into Obsidian to verify rendering
