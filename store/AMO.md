# Firefox Add-ons (AMO) submission kit

Package: `dist/a11y-lens-firefox.zip` (built by `./build-firefox.sh`, v1.12.2,
gecko id `a11y-lens@engagendy.dev`, event-page background).

## Steps

1. Create/sign in at https://addons.mozilla.org → developer hub
   (https://addons.mozilla.org/developers/) → **Submit a New Add-on**
2. Choose **On this site** (listed) → upload `dist/a11y-lens-firefox.zip`
3. Firefox validation runs automatically. Expected results:
   - 0 errors (the manifest declares
     `data_collection_permissions: {"required": ["none"]}` — Firefox's
     built-in data-consent requirement; this extension collects nothing)
   - ~10 warnings, all inside `vendor/axe.min.js` ("Function constructor is
     eval", "unsafe innerHTML") — these are part of the official axe-core
     build and are informational; they do not block review
4. **Source code step:** because `vendor/axe.min.js` is minified, AMO asks
   about source. Answer: the minified file is the unmodified official release
   of the public library axe-core v4.13.0 (MPL-2.0), byte-identical to
   https://cdn.jsdelivr.net/npm/axe-core@4.13.0/axe.min.js
   (https://github.com/dequelabs/axe-core/releases). Per AMO policy, known
   third-party libraries referenced to their official source do not require
   uploading source. All first-party code in the package is unminified.
   Paste that note into "Notes to Reviewer".
5. Listing fields: reuse `store/LISTING.md` (name, summary, description).
   Category: Developer Tools / Web Development. Privacy policy: the GitHub
   PRIVACY.md URL. Screenshots: the same three PNGs in `store/screenshots/`.
6. Submit. AMO review of new listed add-ons typically takes days to ~2 weeks.

## Firefox-specific notes (also add to the AMO description)

- The color-contrast eyedropper is unavailable in Firefox (no EyeDropper API);
  the panel shows a notice instead. Everything else works identically.
- Local testing: about:debugging → This Firefox → Load Temporary Add-on →
  pick dist/firefox/manifest.json.
