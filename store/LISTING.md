# Chrome Web Store listing — copy-paste material

## Basic info

- **Name:** A11y Lens — Accessibility Checker
- **Category:** Developer Tools
- **Language:** English

## Short description (max 132 chars)

```
Scan any page for WCAG violations with axe-core. Guided manual tests, user flow
recording, contrast checker & exportable reports.
```
(129 characters)

## Detailed description

```
A11y Lens is a complete accessibility auditing toolkit that lives inside your
browser's DevTools. It combines automated scanning (powered by axe-core, the
open-source engine behind Lighthouse) with guided manual testing — because
automated tools alone catch only 30–50% of WCAG issues.

AUTOMATED SCANNING
• One-click axe-core audit of the inspected page, including iframes
• Pick your target: WCAG 2.0 A/AA, 2.1 AA, 2.2 AA, or all rules (+ best practices)
• Findings sorted by severity with the offending HTML, fix guidance, and docs links
• Click any finding to highlight the element on the page, or jump straight to it
  in the Elements panel
• "Highlight all" paints every violation on the page, color-coded by severity

GUIDED MANUAL TESTS (WIZARDS)
• 10 step-by-step wizards for what machines can't judge: keyboard navigation,
  focus visibility & order, headings, landmarks, alt-text quality, zoom/reflow,
  screen readers, motion, and forms
• One yes/no question at a time — the verdict is computed from your answers
• Every "No" becomes a recorded finding; optionally attach a note and pick the
  offending element directly on the page
• Interactive helpers do the setup: numbered tab stops, heading outline,
  landmark overlay, alt-text overlay

USER FLOW RECORDING
• Press record, then use the site: menus, modals, multi-page checkouts
• Every page and UI state is scanned automatically; findings are de-duplicated
  and labeled with the page they came from

AND MORE
• Scan history per URL: "3 new · 5 fixed since last scan" with NEW badges
• Stale-results warning when the page changes after a scan
• Color-contrast eyedropper with WCAG AA/AAA verdicts — sample any pixel on screen
• Export reports as JSON, CSV, or a shareable standalone HTML file
• Options: default rule set, flow scan interval, English or Arabic (RTL) interface
• Keyboard shortcuts: S scan, R record flow, X clear, C contrast, 1/2/3 tabs

PRIVACY
Everything runs locally in your browser. No data is collected, transmitted,
or sold — scan results and settings never leave your machine.

A11y Lens uses the axe-core engine (© Deque Systems, MPL-2.0). This extension
is not affiliated with or endorsed by Deque Systems. "axe" is a trademark of
Deque Systems, Inc.
```

## Permission justifications (Privacy practices tab)

- **scripting:** Required to inject the bundled axe-core accessibility engine
  and highlighting/measurement helpers into the page the user is auditing from
  the DevTools panel. No remote code is executed; all injected code ships inside
  the extension package.
- **storage:** Stores the user's settings (rule set, language, scan interval)
  and per-URL scan history / manual test verdicts locally so users can compare
  scans over time. No data leaves the device.
- **Host permission `<all_urls>`:** The extension is a developer tool that must
  be able to audit whichever page the developer has open in DevTools. Scans run
  only when the user explicitly clicks Scan / Record in the panel.
- **Remote code:** None. axe-core is bundled in the package (vendor/axe.min.js).
- **Data usage declaration:** does NOT collect any user data (tick "no" on all
  categories).

## Single purpose description

```
Audits the web page open in DevTools for accessibility (WCAG) issues and guides
the developer through fixing them.
```

## Assets checklist

- [x] Screenshots (1280×800): store/screenshots/1-automated-scan.png,
      2-guided-wizard.png, 3-help-contrast.png
- [x] Icon 128×128: icons/icon128.png (auto-pulled from the package)
- [ ] Optional small promo tile 440×280 (can skip at first)
- [ ] Privacy policy URL — host store/PRIVACY.md publicly (e.g. GitHub repo /
      gist / GitHub Pages) and paste the URL
