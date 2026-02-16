# Deployment Guide

## Build for Production

```bash
npm run build
```

This produces an optimized `dist/` directory with all extension files.

## Load as Unpacked Extension (Development)

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` directory
5. The extension icon appears in the toolbar

## Chrome Web Store Submission

1. Run `npm run build`
2. Zip the contents of `dist/`:
   ```bash
   cd dist && zip -r ../medium-exporter.zip . && cd ..
   ```
3. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Click **New Item** → upload `medium-exporter.zip`
5. Fill in listing details (description, screenshots, category)
6. Submit for review

## Verification Checklist

- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Popup opens when clicking the extension icon
- [ ] Article title and URL display on a Medium page
- [ ] "Copy as Markdown" produces valid Markdown
- [ ] "Download .md" saves a file with correct filename format
- [ ] "Send to Obsidian" creates note in vault (requires Local REST API plugin)
- [ ] Obsidian settings save and persist across popup sessions
- [ ] Obsidian "Test" button validates connection
- [ ] Obsidian vault folder setting works (note created in correct folder)
- [ ] Frontmatter toggle works (on/off)
- [ ] Images toggle works (on/off)
- [ ] Non-Medium pages show an error message
- [ ] No console errors in the popup or service worker
