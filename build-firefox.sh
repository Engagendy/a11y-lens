#!/bin/bash
# Builds the Firefox variant: same code (the EXT namespace shim handles API
# differences), Firefox-specific manifest (event-page background, gecko id).
set -euo pipefail
cd "$(dirname "$0")"

DIST="dist/firefox"
rm -rf "$DIST"
mkdir -p "$DIST"

cp -R manifest.json background.js devtools.html devtools.js \
  panel.html panel.css panel.js fixes.js options.html options.js popup.html \
  icons vendor "$DIST/"

python3 - "$DIST/manifest.json" <<'EOF'
import json, sys
path = sys.argv[1]
m = json.load(open(path))
# Firefox MV3 uses event pages, not service workers
m["background"] = {"scripts": ["background.js"]}
m.pop("minimum_chrome_version", None)
m["browser_specific_settings"] = {
    "gecko": {
        "id": "a11y-lens@engagendy.dev",  # AMO identity — never change, even after rebrand
        "strict_min_version": "115.0",
        # Firefox built-in data consent: this extension collects nothing.
        # https://mzl.la/firefox-builtin-data-consent
        "data_collection_permissions": {"required": ["none"]},
    }
}
json.dump(m, open(path, "w"), indent=2)
EOF

(cd "$DIST" && zip -qr ../a11y-miyar-firefox.zip . -x "*.DS_Store")
echo "Built dist/a11y-miyar-firefox.zip"
echo "Test in Firefox: about:debugging → This Firefox → Load Temporary Add-on → pick $DIST/manifest.json"
echo "Note: the contrast eyedropper is unavailable in Firefox (no EyeDropper API) — the panel shows a notice instead."