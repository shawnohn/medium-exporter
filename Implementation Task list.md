# Implementation Task List  
Medium to Markdown Exporter (Chrome Extension)

---

## 1. Repo and Project Setup
1.1 Create repository structure  
- `/extension`  
- `/extension/src`  
- `/extension/public`  
- `/extension/dist`  

1.2 Choose build tooling  
- Vite or webpack/esbuild  
- Separate bundles for `content`, `background`, and `popup`

1.3 Add TypeScript (recommended)  
- `tsconfig.json`  
- Chrome extension type definitions  

1.4 Add linting and formatting  
- ESLint  
- Prettier  

---

## 2. Manifest V3 Scaffold
2.1 Create `manifest.json`  
- `manifest_version: 3`  
- `action` with `popup.html`  
- Permissions: `activeTab`, `scripting`, `clipboardWrite`, `downloads`  
- `background.service_worker`  
- Medium host permissions  

2.2 Add extension icons  
- 16×16  
- 32×32  
- 48×48  
- 128×128  

---

## 3. Popup UI
3.1 Create popup files  
- `popup.html`  
- `popup.ts` or `popup.js`  

3.2 Popup UI elements  
- Article title (read-only)  
- Source URL (read-only)  
- Toggle: include frontmatter  
- Toggle: include images  
- Button: Copy as Markdown  
- Button: Download `.md`  
- Status / error message area  

3.3 State persistence  
- Store toggle states using `chrome.storage.local` or `chrome.storage.sync`

---

## 4. Content Extraction (Content Script)
4.1 Create content extraction script  
- Locate `<article>` element  
- Fallback to `<main>` if needed  

4.2 Metadata extraction  
- Title (Open Graph → DOM fallback)  
- Canonical URL  
- Author (JSON-LD → meta → DOM)  
- Published date (meta / JSON-LD)  
- Retrieved date (current timestamp)  

4.3 Content sanitization  
- Remove clap, share, follow UI  
- Remove subscription and recommendation blocks  
- Preserve semantic content only  

4.4 Message return format  
- `{ metadata, articleHtml }`

---

## 5. HTML to Markdown Conversion
5.1 Add HTML-to-Markdown library  
- Bundle Turndown locally  

5.2 Conversion module  
- Input: sanitized article HTML  
- Output: Markdown body  

5.3 Custom conversion rules  
- Code blocks → fenced Markdown  
- Figures → images with optional captions  
- Clean excessive whitespace  

5.4 Optional enhancements  
- Inline code handling  
- Highlight conversion (`==text==`)  

---

## 6. Markdown Assembly
6.1 Frontmatter builder  
- Toggle-controlled YAML generation  
- Include only available metadata  

6.2 Final Markdown output  
- Frontmatter (optional)  
- Title heading  
- Article body  

6.3 Filename generator  
- Format: `YYYY-MM-DD - article-title.md`  
- Slugify invalid characters  

---

## 7. Clipboard Export
7.1 Implement clipboard copy  
- Use `navigator.clipboard.writeText`  
- Fallback copy method if needed  

7.2 User feedback  
- Success message on copy  
- Error message on failure  

---

## 8. File Download
8.1 Markdown file download  
- Create Blob from Markdown  
- Use `chrome.downloads.download`  

8.2 Cleanup  
- Revoke object URLs after use  

---

## 9. Script Injection and Messaging
9.1 Injection strategy  
- Register content script or inject on demand  

9.2 Message flow  
- Popup → Background  
- Background → Content script  
- Content script → Background  
- Background → Popup  

---

## 10. Error Handling
10.1 Non-Medium page  
- Show user-facing warning  

10.2 Extraction failure  
- Show extraction error  

10.3 Conversion failure  
- Show conversion error  

10.4 Clipboard or download failure  
- Show actionable error message  

---

## 11. Manual QA Checklist
11.1 Test scenarios  
- Standard Medium article  
- Article with code blocks  
- Article with images  
- Article with lists and blockquotes  
- Member-only article with partial content  

11.2 Validation  
- Markdown renders correctly in Obsidian  
- YAML frontmatter is valid  
- Links and code blocks preserved  

---

## 12. Packaging and Release
12.1 Production build  
- Verify manifest and asset paths  

12.2 Load unpacked extension  
- Chrome → Extensions → Developer Mode  

12.3 Versioning  
- Start at `0.1.0`  
- Increment patch versions for fixes  