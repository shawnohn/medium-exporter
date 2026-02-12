# Medium to Markdown Exporter

A Chrome extension that exports Medium articles into clean, Obsidian-compatible Markdown. Copy to clipboard or download as `.md` — fully local, no external services.

## Features

- **One-click export** — click the extension icon on any Medium article
- **Clipboard copy** — paste directly into Obsidian or any editor
- **File download** — saves as `YYYY-MM-DD - article-title.md`
- **YAML frontmatter** — optional metadata block (title, author, source, dates)
- **Smart extraction** — strips Medium UI noise (claps, follow buttons, recommendations, sign-up prompts)
- **Code block support** — preserves fenced code blocks with language detection
- **Image toggle** — include or exclude images from output
- **Fully local** — no API calls, no telemetry, no data leaves your browser

## Install

### From source

```bash
git clone https://github.com/shawnohn/medium-exporter.git
cd medium-exporter
npm install
npm run build
```

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `dist/` folder

### Development

```bash
npm run dev
```

Starts Vite with HMR. The extension auto-reloads on code changes.

## Usage

1. Navigate to any Medium article
2. Click the extension icon
3. The popup shows the article title and URL
4. Toggle **Include frontmatter** and **Include images** as needed
5. Click **Copy as Markdown** or **Download .md**

### Example output

```markdown
---
title: "How to Build a Chrome Extension"
author: "Jane Doe"
source: "https://medium.com/@jane/how-to-build-a-chrome-extension-abc123"
published: "2025-03-15"
retrieved: "2025-04-01"
---

# How to Build a Chrome Extension

Article content converted to clean Markdown...
```

## Architecture

| Component | File | Role |
|-----------|------|------|
| Content extractor | `src/content/extractor.ts` | Injected into Medium pages to extract article HTML and metadata |
| Service worker | `src/background/service-worker.ts` | Handles tab injection and file downloads |
| Popup | `src/popup/` | User-facing UI, runs Markdown conversion |
| Converter | `src/shared/converter.ts` | Turndown with custom rules for code blocks, figures, images |
| Frontmatter | `src/shared/frontmatter.ts` | YAML frontmatter generation |

## Tech Stack

- TypeScript
- Vite + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin/)
- [Turndown](https://github.com/mixmark-io/turndown) for HTML-to-Markdown
- Chrome Extension Manifest V3

## Permissions

| Permission | Reason |
|------------|--------|
| `activeTab` | Access the current tab when user clicks the extension |
| `scripting` | Inject the content extractor into the page |
| `clipboardWrite` | Copy Markdown to clipboard |
| `downloads` | Save `.md` files |

No broad host permissions. No background network activity.

## License

MIT
