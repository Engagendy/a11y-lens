// Works on Chromium (chrome.*) and Firefox (browser.*, promise-based).
const EXT = globalThis.browser || globalThis.chrome;
EXT.devtools.panels.create("A11y Miyar", "icons/icon48.png", "panel.html");
