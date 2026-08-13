// Options page runs in a normal extension context, so EXT.storage is available directly.
// Works on Chromium (chrome.*) and Firefox (browser.*, promise-based).
const EXT = globalThis.browser || globalThis.chrome;
const DEFAULTS = { level: "wcag22aa", bestPractice: false, flowInterval: 4, lang: "en", framework: "html", dlsContrast: false };

const levelEl = document.getElementById("level");
const bpEl = document.getElementById("bestPractice");
const intervalEl = document.getElementById("flowInterval");
const langEl = document.getElementById("lang");
const frameworkEl = document.getElementById("framework");
const dlsContrastEl = document.getElementById("dlsContrast");
const aiKeyEl = document.getElementById("aiKey");
const aiModelEl = document.getElementById("aiModel");
const savedEl = document.getElementById("saved");

async function load() {
  const stored = await EXT.storage.sync.get("settings");
  const s = { ...DEFAULTS, ...(stored.settings || {}) };
  levelEl.value = s.level;
  bpEl.checked = s.bestPractice;
  intervalEl.value = s.flowInterval;
  langEl.value = s.lang;
  frameworkEl.value = s.framework;
  dlsContrastEl.checked = !!s.dlsContrast;
  document.documentElement.dir = s.lang === "ar" ? "rtl" : "ltr";
  // API key stays in local storage — never sync a key across devices.
  const local = await EXT.storage.local.get(["aiKey", "aiModel"]);
  aiKeyEl.value = local.aiKey || "";
  aiModelEl.value = local.aiModel || "claude-opus-4-8";
}

function flashSaved() {
  savedEl.classList.add("show");
  setTimeout(() => savedEl.classList.remove("show"), 1500);
}

async function save() {
  const settings = {
    level: levelEl.value,
    bestPractice: bpEl.checked,
    flowInterval: Math.min(Math.max(parseInt(intervalEl.value, 10) || 4, 2), 30),
    lang: langEl.value,
    framework: frameworkEl.value,
    dlsContrast: dlsContrastEl.checked,
  };
  await EXT.storage.sync.set({ settings });
  document.documentElement.dir = settings.lang === "ar" ? "rtl" : "ltr";
  flashSaved();
}

async function saveAi() {
  await EXT.storage.local.set({ aiKey: aiKeyEl.value.trim(), aiModel: aiModelEl.value });
  flashSaved();
}

for (const el of [levelEl, bpEl, intervalEl, langEl, frameworkEl, dlsContrastEl]) el.addEventListener("change", save);
for (const el of [aiKeyEl, aiModelEl]) el.addEventListener("change", saveAi);
load();
