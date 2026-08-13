#!/bin/bash
# Updates the bundled axe-core engine to the latest npm release.
set -euo pipefail
cd "$(dirname "$0")"
LATEST=$(curl -s https://registry.npmjs.org/axe-core/latest | python3 -c "import json,sys; print(json.load(sys.stdin)['version'])")
echo "Latest axe-core: $LATEST"
curl -sL "https://cdn.jsdelivr.net/npm/axe-core@${LATEST}/axe.min.js" -o vendor/axe.min.js
node -e "
const s = require('fs').readFileSync('vendor/axe.min.js','utf8');
const m = s.match(/version=\"([\d.]+)\"/);
if (!m || m[1] !== '${LATEST}') { console.error('version check failed'); process.exit(1); }
console.log('vendor/axe.min.js updated to', m[1]);
"
echo "Remember to bump manifest version and rebuild the store/Firefox zips."
