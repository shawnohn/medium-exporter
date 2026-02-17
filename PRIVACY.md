# Privacy Policy

**Medium to Markdown Exporter** is a browser extension that converts Medium articles to Markdown format. It is designed with privacy as a core principle.

## Data Collection

This extension **does not collect, store, or transmit any user data**. Specifically:

- No personal information is collected
- No browsing history is tracked
- No analytics or telemetry is sent
- No cookies are set
- No data is shared with third parties

## Local Processing

All article extraction and Markdown conversion happens **entirely within your browser**. No data leaves your device.

## Optional Obsidian Integration

If you choose to use the "Send to Obsidian" feature, article content is sent **only to your locally running Obsidian application** via `localhost` (127.0.0.1). This traffic never leaves your machine. The API key and connection settings are stored locally in Chrome's extension storage and are never transmitted externally.

## Permissions

The extension requests only the minimum permissions needed to function:

- **activeTab** — access the current tab only when you click the extension icon
- **scripting** — inject the content extractor into the Medium page
- **clipboardWrite** — copy Markdown to your clipboard
- **downloads** — save Markdown as a `.md` file
- **storage** — persist your Obsidian settings locally

## Contact

If you have questions about this privacy policy, please open an issue at [github.com/shawnohn/medium-exporter](https://github.com/shawnohn/medium-exporter/issues).
