# A11y Lens — Privacy Policy

_Last updated: August 12, 2026_

A11y Lens is a browser extension that audits web pages for accessibility issues.

## Data collection

A11y Lens does **not** collect, transmit, sell, or share any user data.
There are no analytics, no telemetry, no accounts, and no external servers.

## What stays on your device

The extension stores the following **locally in your browser only**:

- Your preferences (selected WCAG rule set, language, flow scan interval),
  in `chrome.storage.sync` so they follow your browser profile.
- Per-URL scan history (violation fingerprints and timestamps) and manual test
  verdicts, in `chrome.storage.local`, so the extension can show you what
  changed between scans.

This data never leaves your machine and can be removed at any time by clearing
the extension's storage or uninstalling the extension.

## Page access

The extension injects the bundled axe-core engine into the page you are
inspecting **only when you explicitly start a scan, recording, or helper** from
the DevTools panel. Page content is analyzed in-memory to produce the report
shown to you; it is not stored (beyond the violation fingerprints described
above) or transmitted anywhere.

## Third-party code

A11y Lens bundles the open-source axe-core engine (Mozilla Public License 2.0,
© Deque Systems, Inc.). No code is loaded from remote servers.

## Contact

Questions about this policy: engagendy@gmail.com
