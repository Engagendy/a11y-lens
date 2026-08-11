// Options page runs in a normal extension context, so chrome.storage is available directly.
const DEFAULTS = { level: "wcag22aa", bestPractice: false, flowInterval: 4, lang: "en" };

const levelEl = document.getElementById("level");
const bpEl = document.getElementById("bestPractice");
const intervalEl = document.getElementById("flowInterval");
const langEl = document.getElementById("lang");
const savedEl = document.getElementById("saved");

async function load() {
  const stored = await chrome.storage.sync.get("settings");
  const s = { ...DEFAULTS, ...(stored.settings || {}) };
  levelEl.value = s.level;
  bpEl.checked = s.bestPractice;
  intervalEl.value = s.flowInterval;
  langEl.value = s.lang;
  document.documentElement.dir = s.lang === "ar" ? "rtl" : "ltr";
}

async function save() {
  const settings = {
    level: levelEl.value,
    bestPractice: bpEl.checked,
    flowInterval: Math.min(Math.max(parseInt(intervalEl.value, 10) || 4, 2), 30),
    lang: langEl.value,
  };
  await chrome.storage.sync.set({ settings });
  document.documentElement.dir = settings.lang === "ar" ? "rtl" : "ltr";
  savedEl.classList.add("show");
  setTimeout(() => savedEl.classList.remove("show"), 1500);
}

for (const el of [levelEl, bpEl, intervalEl, langEl]) el.addEventListener("change", save);
load();
