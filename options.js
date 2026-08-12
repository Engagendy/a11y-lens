// Options page runs in a normal extension context, so chrome.storage is available directly.
const DEFAULTS = { level: "wcag22aa", bestPractice: false, flowInterval: 4, lang: "en", framework: "html" };

const levelEl = document.getElementById("level");
const bpEl = document.getElementById("bestPractice");
const intervalEl = document.getElementById("flowInterval");
const langEl = document.getElementById("lang");
const frameworkEl = document.getElementById("framework");
const aiKeyEl = document.getElementById("aiKey");
const aiModelEl = document.getElementById("aiModel");
const savedEl = document.getElementById("saved");

async function load() {
  const stored = await chrome.storage.sync.get("settings");
  const s = { ...DEFAULTS, ...(stored.settings || {}) };
  levelEl.value = s.level;
  bpEl.checked = s.bestPractice;
  intervalEl.value = s.flowInterval;
  langEl.value = s.lang;
  frameworkEl.value = s.framework;
  document.documentElement.dir = s.lang === "ar" ? "rtl" : "ltr";
  // API key stays in local storage — never sync a key across devices.
  const local = await chrome.storage.local.get(["aiKey", "aiModel"]);
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
  };
  await chrome.storage.sync.set({ settings });
  document.documentElement.dir = settings.lang === "ar" ? "rtl" : "ltr";
  flashSaved();
}

async function saveAi() {
  await chrome.storage.local.set({ aiKey: aiKeyEl.value.trim(), aiModel: aiModelEl.value });
  flashSaved();
}

for (const el of [levelEl, bpEl, intervalEl, langEl, frameworkEl]) el.addEventListener("change", save);
for (const el of [aiKeyEl, aiModelEl]) el.addEventListener("change", saveAi);
load();
