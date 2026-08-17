# A11y Miyar — CI companion

Runs the **same axe-core rule sets** as the A11y Miyar extension, headlessly via
Playwright, and fails the build when new accessibility violations appear.
The extension becomes your local debugging view for CI failures.

## Setup

```bash
cd ci
npm install          # also downloads the Chromium browser for Playwright
```

Edit `a11y.config.json`:

| Field | Meaning |
|---|---|
| `urls` | Pages to scan (your dev server must be running, or use deployed URLs) |
| `level` | `wcag2a` \| `wcag2aa` \| `wcag21aa` \| `wcag22aa` \| `all` — same options as the extension |
| `bestPractice` | Also run axe best-practice rules |
| `failOn` | `"new"` (fail only on violations not in the baseline) or `"any"` |
| `baseline` | Baseline filename |

## Usage

```bash
npm run a11y:baseline   # first run: accept current violations as known issues
npm run a11y            # every run after: fails (exit 1) on NEW violations
npm run a11y -- --suggest   # also print a suggested fix snippet for each failing finding
```

`--suggest` uses the same fix engine (`fixes.js`) as the extension's DevTools
panel, so CI output and the panel suggest identical fixes.

Fix flow: CI fails → open the listed page in Chrome/Brave → A11y Miyar DevTools
panel → scan → click the finding to highlight/Inspect → fix → `npm run a11y`
passes → once old baseline issues are fixed, run `a11y:baseline` again to shrink it.

## GitHub Actions example

```yaml
name: accessibility
on: [pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build && npm run start &   # start your app
      - run: npx wait-on http://localhost:3000
      - run: cd ci && npm ci && npm run a11y
```
