const tabId = chrome.devtools.inspectedWindow.tabId;

/* ---------------- background messaging ----------------
   DevTools pages cannot use chrome.scripting / chrome.storage.
   All page injection and storage goes through background.js. */

function bg(op, extra = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ op, tabId, ...extra }, (res) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (res && res.error) return reject(new Error(res.error));
      resolve(res ? res.result : undefined);
    });
  });
}

/* ---------------- i18n ---------------- */

const STR = {
  en: {
    scan: "▶ Scan this page", scanShort: "Scan",
    flow: "⏺ Record flow", stopFlow: "■ Stop flow",
    clear: "✕ Clear highlights", contrast: "◐ Contrast",
    highlightAll: "◉ Highlight all",
    tabAuto: "Automated", tabManual: "🧭 Manual tests", tabHelp: "❓ Help",
    scanning: "Scanning…",
    exportLabel: "Export:",
    bestPractices: "best practices",
    pickFg: "⧉ Pick text color", pickBg: "⧉ Pick background",
    emptyResults: "Click Scan this page to run an axe-core audit on the inspected page.",
    stale: "⚠ The page has changed since the last scan — results may be stale. Re-scan to refresh.",
    recording: "⏺ Recording — interact with the page, navigate, open menus…",
    firstScan: "first scan of this URL",
    yes: "Yes", no: "No", skip: "Skip",
    startWizard: "🧙 Start guided test", question: "Question",
    pickElement: "📌 Pick element on page", picking: "Click the element on the page…",
    continueBtn: "Continue", done: "Done", noteHint: "Optional note about what failed…",
    pass: "Pass", fail: "Fail", na: "N/A",
    critical: "critical", serious: "serious", moderate: "moderate", minor: "minor", passed: "passed",
  },
  ar: {
    scan: "▶ فحص هذه الصفحة", scanShort: "فحص",
    flow: "⏺ تسجيل مسار", stopFlow: "■ إيقاف التسجيل",
    clear: "✕ مسح التظليل", contrast: "◐ التباين",
    highlightAll: "◉ تظليل الكل",
    tabAuto: "الفحص الآلي", tabManual: "🧭 اختبارات يدوية", tabHelp: "❓ مساعدة",
    scanning: "جارٍ الفحص…",
    exportLabel: "تصدير:",
    bestPractices: "أفضل الممارسات",
    pickFg: "⧉ اختر لون النص", pickBg: "⧉ اختر لون الخلفية",
    emptyResults: "اضغط \"فحص هذه الصفحة\" لتشغيل تدقيق axe-core على الصفحة.",
    stale: "⚠ تغيّرت الصفحة منذ آخر فحص — قد تكون النتائج قديمة. أعد الفحص.",
    recording: "⏺ جارٍ التسجيل — تفاعل مع الصفحة وتنقّل وافتح القوائم…",
    firstScan: "أول فحص لهذا الرابط",
    yes: "نعم", no: "لا", skip: "تخطّي",
    startWizard: "🧙 بدء الاختبار الموجّه", question: "سؤال",
    pickElement: "📌 اختر عنصراً من الصفحة", picking: "انقر على العنصر في الصفحة…",
    continueBtn: "متابعة", done: "تم", noteHint: "ملاحظة اختيارية حول سبب الفشل…",
    pass: "ناجح", fail: "فاشل", na: "لا ينطبق",
    critical: "حرِج", serious: "خطير", moderate: "متوسط", minor: "بسيط", passed: "ناجح",
  },
};

let lang = "en";
const t = (key) => (STR[lang] && STR[lang][key]) || STR.en[key] || key;

/* ---------------- element refs ---------------- */

const scanBtn = document.getElementById("scanBtn");
const flowBtn = document.getElementById("flowBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const resultsEl = document.getElementById("results");
const levelSelect = document.getElementById("levelSelect");
const bestPractice = document.getElementById("bestPractice");
const exportGroup = document.getElementById("exportGroup");
const highlightAllBtn = document.getElementById("highlightAllBtn");
const autofixBtn = document.getElementById("autofixBtn");
const diffEl = document.getElementById("diff");
const staleEl = document.getElementById("stale");
const contrastToggle = document.getElementById("contrastToggle");
const contrastBar = document.getElementById("contrastBar");
const tabsNav = document.getElementById("tabs");
const manualView = document.getElementById("manual");
const manualListEl = document.getElementById("manualList");
const manualProgressEl = document.getElementById("manualProgress");
const helpView = document.getElementById("help");
const helpListEl = document.getElementById("helpList");

const LEVEL_TAGS = {
  wcag2a: ["wcag2a"],
  wcag2aa: ["wcag2a", "wcag2aa"],
  wcag21aa: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  wcag22aa: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
};

let settings = { level: "wcag22aa", bestPractice: false, flowInterval: 4, lang: "en" };
let lastReport = null;

/* ---------------- init ---------------- */

async function init() {
  try {
    settings = await bg("settingsGet");
  } catch (_) { /* fall back to defaults */ }
  lang = settings.lang || "en";
  if (lang === "ar") {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }
  levelSelect.value = settings.level || "wcag22aa";
  bestPractice.checked = !!settings.bestPractice;
  applyStrings();
}

function applyStrings() {
  scanBtn.textContent = t("scan");
  flowBtn.textContent = t("flow");
  clearBtn.textContent = t("clear");
  contrastToggle.textContent = t("contrast");
  highlightAllBtn.textContent = t("highlightAll");
  tabsNav.querySelector("[data-view='auto']").textContent = t("tabAuto");
  const mBtn = tabsNav.querySelector("[data-view='manual']");
  mBtn.textContent = t("tabManual") + " ";
  mBtn.appendChild(manualProgressEl);
  tabsNav.querySelector("[data-view='help']").textContent = t("tabHelp");
  document.querySelector("#results .empty").textContent = t("emptyResults");
  staleEl.textContent = t("stale");
  document.getElementById("pickFg").textContent = t("pickFg");
  document.getElementById("pickBg").textContent = t("pickBg");
  document.querySelector("label.check").lastChild.textContent = " " + t("bestPractices");
}

init();

/* ---------------- event wiring ---------------- */

scanBtn.addEventListener("click", runScan);
clearBtn.addEventListener("click", clearHighlights);
highlightAllBtn.addEventListener("click", highlightAll);
flowBtn.addEventListener("click", () => (flowRecording ? stopFlow() : startFlow()));
for (const btn of document.querySelectorAll("button.export")) {
  btn.addEventListener("click", () => exportReport(btn.dataset.format));
}
document.getElementById("helpBtn").addEventListener("click", () => showView("help"));
levelSelect.addEventListener("change", () => bg("settingsSet", { value: { level: levelSelect.value } }).catch(() => {}));
bestPractice.addEventListener("change", () => bg("settingsSet", { value: { bestPractice: bestPractice.checked } }).catch(() => {}));

// Panel-local keyboard shortcuts (documented in Help)
document.addEventListener("keydown", (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "s") runScan();
  else if (k === "r") flowRecording ? stopFlow() : startFlow();
  else if (k === "x") clearHighlights();
  else if (k === "c") contrastToggle.click();
  else if (k === "1") showView("auto");
  else if (k === "2") showView("manual");
  else if (k === "3") showView("help");
});

/* ---------------- tabs ---------------- */

tabsNav.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]");
  if (btn) showView(btn.dataset.view);
});

function showView(view) {
  for (const b of tabsNav.querySelectorAll("button[data-view]")) {
    b.classList.toggle("active", b.dataset.view === view);
  }
  resultsEl.hidden = view !== "auto";
  manualView.hidden = view !== "manual";
  helpView.hidden = view !== "help";
  if (view === "manual") loadManual();
  if (view === "help") renderHelp();
}

/* ---------------- scanning ---------------- */

function currentRunOnly() {
  if (levelSelect.value === "all") return null;
  const tags = [...LEVEL_TAGS[levelSelect.value]];
  if (bestPractice.checked) tags.push("best-practice");
  return { type: "tag", values: tags };
}

function currentRuleSetLabel() {
  return levelSelect.value === "all"
    ? "all rules"
    : levelSelect.selectedOptions[0].textContent + (bestPractice.checked ? " + best practices" : "");
}

async function performAxeScan() {
  await bg("injectAxe");
  return bg("runAxe", { runOnly: currentRunOnly() });
}

async function runScan() {
  if (scanBtn.disabled) return;
  scanBtn.disabled = true;
  statusEl.textContent = t("scanning");
  try {
    const result = await performAxeScan();
    lastReport = {
      ...result,
      scannedAt: new Date().toISOString(),
      ruleSet: currentRuleSetLabel(),
    };
    await applyHistoryDiff(lastReport);
    render(lastReport);
    exportGroup.hidden = false;
    highlightAllBtn.hidden = false;
    updateAutofixButton();
    const frameNote = result.frames ? ` (incl. ${result.frames} iframe(s))` : "";
    statusEl.textContent = `Done — ${result.violations.length} rule(s) violated${frameNote}`;
    startStaleWatch();
  } catch (err) {
    statusEl.textContent = "Scan failed: " + (err?.message || err);
    console.error(err);
  } finally {
    scanBtn.disabled = false;
  }
}

/* ---------------- rendering ---------------- */

function render(report) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of report.violations) counts[v.impact] = (counts[v.impact] || 0) + v.nodeTotal;

  document.getElementById("countCritical").textContent = `${counts.critical} ${t("critical")}`;
  document.getElementById("countSerious").textContent = `${counts.serious} ${t("serious")}`;
  document.getElementById("countModerate").textContent = `${counts.moderate} ${t("moderate")}`;
  document.getElementById("countMinor").textContent = `${counts.minor} ${t("minor")}`;
  document.getElementById("countPasses").textContent = `${report.passes} ${t("passed")}`;
  summaryEl.hidden = false;

  resultsEl.textContent = "";
  if (!report.violations.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "🎉 No violations found by automated checks. Remember: automated tools catch only part of WCAG — run the Manual tests too.";
    resultsEl.appendChild(p);
    return;
  }

  const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const sorted = [...report.violations].sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  for (const v of sorted) {
    const det = document.createElement("details");
    det.className = "violation";
    det.dataset.impact = v.impact;

    const sum = document.createElement("summary");
    sum.innerHTML = `<span class="impact-tag"></span><span class="rule-title"></span><span class="node-count"></span>`;
    sum.querySelector(".impact-tag").textContent = v.impact;
    sum.querySelector(".rule-title").textContent = v.help;
    sum.querySelector(".node-count").textContent = `${v.nodeTotal} element(s)`;
    det.appendChild(sum);

    const body = document.createElement("div");
    body.className = "violation-body";

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = v.description + " ";
    const link = document.createElement("a");
    link.href = v.helpUrl;
    link.target = "_blank";
    link.textContent = "Learn more ↗";
    desc.appendChild(link);
    body.appendChild(desc);

    for (const node of v.nodes) {
      const nodeEl = document.createElement("div");
      nodeEl.className = "node";

      const code = document.createElement("code");
      const inIframe = node.target.length > 1;
      code.title = inIframe
        ? "Element is inside an iframe — clicking highlights the iframe"
        : "Click to highlight this element on the page";
      code.textContent = (node.pageLabel ? `[${node.pageLabel}] ` : "") +
        (inIframe ? "[iframe] " : "") + node.html;
      code.addEventListener("click", () => highlight(node.target));
      nodeEl.appendChild(code);

      const actions = document.createElement("div");
      actions.className = "actions";
      if (node.isNew) {
        const badge = document.createElement("span");
        badge.className = "badge-new";
        badge.textContent = "NEW";
        badge.title = "Not present in the previous scan of this URL";
        actions.appendChild(badge);
      }
      if (!inIframe) {
        const inspectBtn = document.createElement("button");
        inspectBtn.textContent = "Inspect";
        inspectBtn.title = "Open this element in the Elements panel";
        inspectBtn.addEventListener("click", () => inspectElement(node.target[0]));
        actions.appendChild(inspectBtn);
      }
      if (actions.childElementCount) nodeEl.appendChild(actions);

      if (node.failureSummary) {
        const fix = document.createElement("div");
        fix.className = "fix";
        fix.textContent = node.failureSummary;
        nodeEl.appendChild(fix);
      }
      const fixSuggestion = A11yFixes.suggestFix(v.id, node, settings.framework || "html");
      if (fixSuggestion) nodeEl.appendChild(buildFixSuggestion(v, node, fixSuggestion));
      body.appendChild(nodeEl);
    }

    if (v.nodeTotal > v.nodes.length) {
      const more = document.createElement("p");
      more.className = "empty";
      more.textContent = `…and ${v.nodeTotal - v.nodes.length} more element(s) not shown.`;
      body.appendChild(more);
    }

    det.appendChild(body);
    resultsEl.appendChild(det);
  }
}

/* ---------------- fix suggestions ---------------- */

function buildFixSuggestion(v, node, fix) {
  const wrap = document.createElement("div");
  wrap.className = "fix-suggestion";

  const snippet = document.createElement("code");
  snippet.className = "fix-snippet";
  snippet.textContent = fix.snippet;
  wrap.appendChild(snippet);

  const note = document.createElement("div");
  note.className = "fix-note";
  note.textContent = fix.note;
  wrap.appendChild(note);

  const actions = document.createElement("div");
  actions.className = "actions";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy fix";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(fix.snippet);
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => { copyBtn.textContent = "Copy fix"; }, 1200);
  });
  actions.appendChild(copyBtn);

  const patch = A11yFixes.previewPatch(v.id, node);
  if (patch && node.target.length === 1) {
    const previewBtn = document.createElement("button");
    previewBtn.textContent = "Preview fix";
    previewBtn.addEventListener("click", async () => {
      try {
        if (previewBtn.classList.contains("on")) {
          await bg("undoFix", { selector: node.target[0] });
          previewBtn.classList.remove("on");
          previewBtn.textContent = "Preview fix";
        } else {
          await bg("applyFix", { selector: node.target[0], patch });
          previewBtn.classList.add("on");
          previewBtn.textContent = "Undo";
        }
      } catch (err) {
        statusEl.textContent = "Preview failed: " + (err?.message || err);
      }
    });
    actions.appendChild(previewBtn);
  }

  const aiBtn = document.createElement("button");
  aiBtn.textContent = "🤖 AI fix";
  aiBtn.addEventListener("click", async () => {
    let out = wrap.querySelector(".ai-output");
    if (!out) {
      out = document.createElement("div");
      out.className = "ai-output";
      wrap.appendChild(out);
    }
    try {
      const key = await bg("storeGet", { key: "aiKey" });
      if (!key) {
        out.textContent = "Set an API key in Options (right-click the extension icon → Options) to enable AI fixes.";
        return;
      }
      aiBtn.disabled = true;
      out.textContent = "Thinking…";
      const prompt =
        "You are an accessibility expert. Fix this specific WCAG violation.\n" +
        "Rule: " + v.id + " — " + v.help + "\n" +
        "Failure: " + node.failureSummary + "\n" +
        "HTML: " + node.html + "\n" +
        "Framework: " + (settings.framework || "html") + "\n" +
        "Reply with ONLY the corrected code snippet followed by one short explanation line.";
      out.textContent = await bg("aiFix", { prompt });
    } catch (err) {
      out.textContent = "AI fix failed: " + (err?.message || err);
    } finally {
      aiBtn.disabled = false;
    }
  });
  actions.appendChild(aiBtn);

  wrap.appendChild(actions);
  return wrap;
}

/* ---------------- history / diff ---------------- */

async function applyHistoryDiff(report) {
  const storageKey = "history:" + report.url;
  const nodeKey = (v, n) => v.id + "|" + n.target.join(" ");
  const currentKeys = [];
  for (const v of report.violations) for (const n of v.nodes) currentKeys.push(nodeKey(v, n));

  try {
    const prev = await bg("storeGet", { key: storageKey });
    if (prev && Array.isArray(prev.keys)) {
      const prevSet = new Set(prev.keys);
      const curSet = new Set(currentKeys);
      let added = 0;
      for (const v of report.violations) {
        for (const n of v.nodes) {
          n.isNew = !prevSet.has(nodeKey(v, n));
          if (n.isNew) added++;
        }
      }
      const fixed = prev.keys.filter((k) => !curSet.has(k)).length;
      const when = new Date(prev.scannedAt).toLocaleString();
      diffEl.textContent = "";
      if (added || fixed) {
        const worse = document.createElement("span");
        worse.className = "worse";
        worse.textContent = `${added} new`;
        const better = document.createElement("span");
        better.className = "better";
        better.textContent = `${fixed} fixed`;
        diffEl.append("vs last scan: ", worse, " · ", better, ` (${when})`);
      } else {
        diffEl.textContent = `no change since last scan (${when})`;
      }
    } else {
      diffEl.textContent = t("firstScan");
    }
    await bg("storeSet", { key: storageKey, value: { keys: currentKeys, scannedAt: report.scannedAt } });
  } catch (err) {
    console.error("history diff failed", err);
    diffEl.textContent = "";
  }
}

/* ---------------- highlight / inspect ---------------- */

function highlight(target) {
  bg("highlight", { selector: target[0] }).catch(() => {});
}

function highlightAll() {
  if (!lastReport) return;
  const items = [];
  for (const v of lastReport.violations) {
    for (const n of v.nodes) items.push({ sel: n.target[0], impact: v.impact });
  }
  bg("highlightAll", { items }).catch(() => {});
}

function clearHighlights() {
  bg("clearHighlights").catch(() => {});
}

function inspectElement(selector) {
  chrome.devtools.inspectedWindow.eval(
    `inspect(document.querySelector(${JSON.stringify(selector)}))`
  );
}

/* ---------------- auto-fix page ---------------- */

let autofixApplied = false;

function fixableItems() {
  if (!lastReport) return [];
  const items = [];
  for (const v of lastReport.violations) {
    for (const n of v.nodes) {
      if (n.target.length !== 1) continue;
      const patch = A11yFixes.previewPatch(v.id, n);
      if (patch) items.push({ selector: n.target[0], patch });
    }
  }
  return items;
}

function updateAutofixButton() {
  autofixApplied = false;
  autofixBtn.classList.remove("on");
  const n = fixableItems().length;
  autofixBtn.hidden = n === 0;
  autofixBtn.textContent = `⚡ Auto-fix page (${n})`;
}

autofixBtn.addEventListener("click", async () => {
  try {
    if (!autofixApplied) {
      const items = fixableItems();
      const applied = await bg("applyFixAll", { items });
      autofixApplied = true;
      autofixBtn.classList.add("on");
      autofixBtn.textContent = `↩ Undo all (${applied})`;
      statusEl.textContent = `⚡ Applied ${applied} live fix(es) — re-scan to verify, then copy the snippets into your source. Reload discards them.`;
    } else {
      const restored = await bg("undoAll");
      updateAutofixButton();
      statusEl.textContent = `Restored ${restored} element(s) to their original state.`;
    }
  } catch (err) {
    statusEl.textContent = "Auto-fix failed: " + (err?.message || err);
  }
});

/* ---------------- stale watch ---------------- */

let stalePoll = null;

async function startStaleWatch() {
  staleEl.hidden = true;
  clearInterval(stalePoll);
  try {
    await bg("staleInstall");
  } catch (_) {
    return;
  }
  stalePoll = setInterval(async () => {
    try {
      if (await bg("staleCheck")) {
        staleEl.hidden = false;
        clearInterval(stalePoll);
      }
    } catch (_) {
      clearInterval(stalePoll);
    }
  }, 2000);
}

chrome.devtools.network.onNavigated.addListener(() => {
  clearInterval(stalePoll);
  if (flowRecording) {
    setTimeout(flowScanOnce, 1200);
    return;
  }
  if (lastReport) staleEl.hidden = false;
});

/* ---------------- user flow analysis ---------------- */

let flowRecording = false;
let flowTimer = null;
let flowSteps = 0;
const flowMap = new Map();

function startFlow() {
  flowRecording = true;
  flowSteps = 0;
  flowMap.clear();
  flowBtn.textContent = t("stopFlow");
  flowBtn.classList.add("recording");
  scanBtn.disabled = true;
  staleEl.hidden = true;
  statusEl.textContent = t("recording");
  flowScanOnce();
  const intervalSec = Math.min(Math.max(settings.flowInterval || 4, 2), 30);
  flowTimer = setInterval(flowScanOnce, intervalSec * 1000);
}

async function flowScanOnce() {
  if (!flowRecording) return;
  try {
    const result = await performAxeScan();
    flowSteps++;
    let pageLabel;
    try {
      const u = new URL(result.url);
      pageLabel = (u.pathname + u.search).slice(0, 60) || "/";
    } catch (_) {
      pageLabel = result.url.slice(0, 60);
    }
    for (const v of result.violations) {
      for (const n of v.nodes) {
        const key = v.id + "|" + n.target.join(" ") + "|" + result.url;
        if (!flowMap.has(key)) flowMap.set(key, { rule: v, node: { ...n, pageLabel } });
      }
    }
    statusEl.textContent = `⏺ ${flowSteps} scan(s), ${flowMap.size} unique finding(s)`;
  } catch (_) {
    // mid-navigation — retry next tick
  }
}

function stopFlow() {
  flowRecording = false;
  clearInterval(flowTimer);
  flowBtn.textContent = t("flow");
  flowBtn.classList.remove("recording");
  scanBtn.disabled = false;

  const byRule = new Map();
  for (const { rule, node } of flowMap.values()) {
    if (!byRule.has(rule.id)) {
      byRule.set(rule.id, { ...rule, nodes: [], nodeTotal: 0 });
    }
    const agg = byRule.get(rule.id);
    agg.nodeTotal++;
    if (agg.nodes.length < 50) agg.nodes.push(node);
  }
  const pages = new Set([...flowMap.values()].map(({ node }) => node.pageLabel));
  lastReport = {
    url: `user flow — ${pages.size} page/state(s), ${flowSteps} scan(s)`,
    frames: 0,
    passes: 0,
    violations: [...byRule.values()],
    scannedAt: new Date().toISOString(),
    ruleSet: currentRuleSetLabel() + " (flow recording)",
  };
  diffEl.textContent = "flow recording — history diff not applied";
  render(lastReport);
  exportGroup.hidden = false;
  highlightAllBtn.hidden = true;
  autofixBtn.hidden = true;
  statusEl.textContent = `Flow done — ${flowMap.size} unique finding(s) across ${pages.size} page/state(s)`;
}

/* ---------------- contrast checker ---------------- */

const fgSwatch = document.getElementById("fgSwatch");
const bgSwatch = document.getElementById("bgSwatch");
const fgHexEl = document.getElementById("fgHex");
const bgHexEl = document.getElementById("bgHex");
const ratioEl = document.getElementById("ratio");
const verdictsEl = document.getElementById("contrastVerdicts");

let fgColor = "#000000";
let bgColor = "#ffffff";

contrastToggle.addEventListener("click", () => {
  contrastBar.hidden = !contrastBar.hidden;
  if (!contrastBar.hidden) {
    document.getElementById("contrastUnsupported").hidden = "EyeDropper" in window;
    updateContrast();
  }
});
document.getElementById("pickFg").addEventListener("click", () => pickColor("fg"));
document.getElementById("pickBg").addEventListener("click", () => pickColor("bg"));

async function pickColor(which) {
  if (!("EyeDropper" in window)) return;
  try {
    const { sRGBHex } = await new EyeDropper().open();
    if (which === "fg") fgColor = sRGBHex;
    else bgColor = sRGBHex;
    updateContrast();
  } catch (_) { /* user pressed Esc */ }
}

function updateContrast() {
  fgSwatch.style.background = fgColor;
  bgSwatch.style.background = bgColor;
  fgHexEl.textContent = fgColor;
  bgHexEl.textContent = bgColor;
  const ratio = contrastRatio(fgColor, bgColor);
  ratioEl.textContent = ratio.toFixed(2) + " : 1";
  const checks = [["AA normal", 4.5], ["AA large", 3], ["AAA normal", 7], ["AAA large", 4.5]];
  verdictsEl.textContent = "";
  for (const [label, min] of checks) {
    const s = document.createElement("span");
    const ok = ratio >= min;
    s.className = "verdict " + (ok ? "pass" : "fail");
    s.textContent = `${label} ${ok ? "✓" : "✗"}`;
    s.title = `Requires ≥ ${min}:1`;
    verdictsEl.appendChild(s);
    verdictsEl.appendChild(document.createTextNode(" "));
  }
}

function contrastRatio(hexA, hexB) {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      let c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [l1, l2] = [lum(hexA), lum(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* ---------------- guided manual tests (IGT wizards) ---------------- */

const MANUAL_TESTS = [
  {
    id: "keyboard", title: "Keyboard-only navigation", wcag: "WCAG 2.1.1 / 2.1.2",
    why: "Many users never touch a mouse. Everything must be reachable and operable with the keyboard alone, with no traps.",
    helper: { label: "Number the tab stops", fn: "tabStops" },
    questions: [
      { q: "Could you reach every interactive element using only Tab (and arrow keys inside widgets)?", finding: "Some controls are unreachable by keyboard" },
      { q: "Could you activate every control with Enter or Space?", finding: "Control(s) cannot be activated by keyboard" },
      { q: "Could you always Tab OUT of every widget — no keyboard traps (modals, players, embeds)?", finding: "Keyboard trap detected" },
      { q: "Is every mouse/hover-only interaction also achievable with the keyboard?", finding: "Mouse-only interaction with no keyboard equivalent" },
    ],
  },
  {
    id: "focus-visible", title: "Visible focus indicator", wcag: "WCAG 2.4.7",
    why: "Sighted keyboard users must always be able to see which element has focus.",
    helper: { label: "Number the tab stops", fn: "tabStops" },
    questions: [
      { q: "Did every tab stop show a clearly visible focus indicator (outline, ring, underline…)?", finding: "Element(s) receive focus with no visible indicator" },
      { q: "Was the indicator clearly visible against the background in every section of the page?", finding: "Focus indicator has insufficient contrast in some areas" },
    ],
  },
  {
    id: "focus-order", title: "Logical focus & reading order", wcag: "WCAG 2.4.3 / 1.3.2",
    why: "Focus should follow the visual/reading flow, or keyboard and screen-reader users get disoriented.",
    helper: { label: "Number the tab stops", fn: "tabStops" },
    questions: [
      { q: "Do the numbered tab stops follow the visual reading order of the page?", finding: "Focus order does not match visual order" },
      { q: "Are there no surprising jumps (into footers, off-screen regions, or CSS-reordered content)?", finding: "Unexpected focus jump" },
    ],
  },
  {
    id: "headings", title: "Heading structure", wcag: "WCAG 1.3.1 / 2.4.6",
    why: "Screen-reader users navigate by headings. The outline must describe the page like a table of contents.",
    helper: { label: "Show heading outline", fn: "headings" },
    questions: [
      { q: "Is there exactly one h1, and does it describe the page's purpose?", finding: "Missing, multiple, or unclear h1" },
      { q: "Do heading levels nest without skipping (h2 → h3, never h2 → h4)?", finding: "Heading levels skip" },
      { q: "Does every heading accurately describe its section (no vague or fake bold-text headings)?", finding: "Unclear or fake heading(s)" },
    ],
  },
  {
    id: "landmarks", title: "Landmarks & skip link", wcag: "WCAG 2.4.1 / 1.3.1",
    why: "Landmarks and a skip link let assistive-tech users jump past repeated content.",
    helper: { label: "Outline landmarks", fn: "landmarks" },
    questions: [
      { q: "Is the primary content inside exactly one main landmark?", finding: "Content not inside a single main landmark" },
      { q: "Is the first Tab stop a working 'skip to content' link?", finding: "No working skip link" },
      { q: "Do repeated landmarks (e.g. two navs) have distinguishing labels?", finding: "Duplicate landmarks lack labels" },
    ],
  },
  {
    id: "alt-quality", title: "Image alt text quality", wcag: "WCAG 1.1.1",
    why: "Automation detects a MISSING alt attribute, but not whether the text is actually meaningful.",
    helper: { label: "Overlay alt text", fn: "altOverlay" },
    questions: [
      { q: "Does every informative image's alt text convey the same information as the image?", finding: "Alt text does not convey the image's information" },
      { q: "Are purely decorative images marked with empty alt (shown as 'decorative')?", finding: "Decorative image announced to screen readers" },
      { q: "Do functional images (in links/buttons) describe the action rather than the picture?", finding: "Functional image alt describes appearance, not action" },
    ],
  },
  {
    id: "zoom", title: "200% zoom & reflow", wcag: "WCAG 1.4.4 / 1.4.10",
    why: "Low-vision users zoom. Content must remain usable without horizontal scrolling or overlap.",
    questions: [
      { q: "At 200% zoom (⌘+ / Ctrl+), is all text and functionality still available — nothing clipped or overlapped?", finding: "Content breaks at 200% zoom" },
      { q: "At ~400% in a normal window (equivalent to 320px width), does content reflow into one column with no horizontal scrolling?", finding: "No reflow at 320px equivalent width" },
    ],
  },
  {
    id: "screen-reader", title: "Screen reader pass", wcag: "WCAG 4.1.2 / 1.3.1",
    why: "The ultimate test: does the page make sense when heard instead of seen? (macOS: ⌘F5 for VoiceOver. Windows: NVDA/Narrator.)",
    questions: [
      { q: "Reading from the top, did everything announced make sense in order?", finding: "Announced content is confusing or out of order" },
      { q: "Did all controls announce a correct role, name, and state ('button', 'checkbox, checked')?", finding: "Control(s) announce wrong or missing role/name/state" },
      { q: "Were dynamic updates (toasts, validation errors, live content) announced?", finding: "Dynamic update is silent to screen readers" },
    ],
  },
  {
    id: "motion", title: "Motion, animation & flashing", wcag: "WCAG 2.2.2 / 2.3.1",
    why: "Auto-playing motion distracts; flashing above 3 Hz can trigger seizures.",
    questions: [
      { q: "Does all auto-playing motion longer than 5 seconds have a pause/stop control?", finding: "Auto-playing motion without pause control" },
      { q: "Is there no content flashing more than 3 times per second?", finding: "Content flashes above 3 Hz" },
      { q: "Is the OS 'reduce motion' preference respected (prefers-reduced-motion)?", finding: "Reduce-motion preference ignored" },
    ],
  },
  {
    id: "forms", title: "Form labels & error handling", wcag: "WCAG 3.3.1 / 3.3.2 / 3.3.3",
    why: "Automation checks that labels exist; only a human can judge whether errors are understandable and recoverable.",
    questions: [
      { q: "When you submit invalid data, are errors described in text (not color alone), saying what is wrong and how to fix it?", finding: "Errors unclear or conveyed by color alone" },
      { q: "Does focus move to (or an announcement happen for) the first invalid field?", finding: "Errors not brought to the user's attention" },
      { q: "Are required fields indicated before submission, not only after failing?", finding: "Required fields not indicated upfront" },
    ],
  },
];

let manualState = { verdicts: {}, findings: {} }; // findings: testId -> [{q, selector, note}]
let manualUrl = null;

async function getPageUrl() {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval("location.href", (res) => resolve(res || "unknown"));
  });
}

async function loadManual() {
  manualUrl = await getPageUrl();
  try {
    const stored = await bg("storeGet", { key: "manual:" + manualUrl });
    manualState = { verdicts: stored?.verdicts || {}, findings: stored?.findings || {} };
  } catch (_) {
    manualState = { verdicts: {}, findings: {} };
  }
  renderManual();
}

async function saveManual() {
  if (!manualUrl) return;
  await bg("storeSet", {
    key: "manual:" + manualUrl,
    value: { ...manualState, updatedAt: new Date().toISOString() },
  }).catch(() => {});
}

function verdictIcon(v) {
  return v === "pass" ? "✅" : v === "fail" ? "❌" : v === "na" ? "➖" : "◻";
}

function renderManual() {
  manualListEl.textContent = "";
  for (const test of MANUAL_TESTS) {
    manualListEl.appendChild(buildManualCard(test));
  }
  updateManualProgress();
}

function buildManualCard(test) {
  const det = document.createElement("details");
  det.className = "mtest";
  det.dataset.testId = test.id;
  const v = manualState.verdicts[test.id];
  if (v) det.dataset.verdict = v;

  const sum = document.createElement("summary");
  const icon = document.createElement("span");
  icon.className = "verdict-icon";
  icon.textContent = verdictIcon(v);
  const title = document.createElement("span");
  title.className = "rule-title";
  title.textContent = test.title;
  const wcag = document.createElement("span");
  wcag.className = "wcag";
  wcag.textContent = test.wcag;
  sum.append(icon, title, wcag);
  det.appendChild(sum);

  const body = document.createElement("div");
  body.className = "mtest-body";
  renderCardIntro(test, det, body);
  det.appendChild(body);
  return det;
}

// Default (non-wizard) card content: why + helper + start button + recorded findings.
function renderCardIntro(test, card, body) {
  body.textContent = "";

  const why = document.createElement("p");
  why.className = "why";
  why.textContent = test.why;
  body.appendChild(why);

  const actions = document.createElement("div");
  actions.className = "mtest-actions";

  if (test.helper) {
    const helperBtn = document.createElement("button");
    helperBtn.textContent = "▶ " + test.helper.label;
    helperBtn.addEventListener("click", () => runManualHelper(test, card));
    actions.appendChild(helperBtn);
  }

  const startBtn = document.createElement("button");
  startBtn.className = "wizard-start";
  startBtn.textContent = t("startWizard");
  startBtn.addEventListener("click", () => startWizard(test, card, body));
  actions.appendChild(startBtn);

  body.appendChild(actions);

  const findings = manualState.findings[test.id] || [];
  if (findings.length) {
    const list = document.createElement("div");
    list.className = "wizard-findings";
    for (const f of findings) {
      const item = document.createElement("div");
      item.className = "wizard-finding";
      item.textContent = "❌ " + f.finding + (f.note ? ` — ${f.note}` : "");
      if (f.selector) {
        const codeEl = document.createElement("code");
        codeEl.textContent = f.selector;
        codeEl.title = "Click to highlight on the page";
        codeEl.addEventListener("click", () => highlight([f.selector]));
        item.appendChild(document.createElement("br"));
        item.appendChild(codeEl);
      }
      list.appendChild(item);
    }
    body.appendChild(list);
  }
}

async function runManualHelper(test, card) {
  try {
    const result = await bg("helper", { name: test.helper.fn });
    let out = card.querySelector(".mtest-output");
    if (!out) {
      out = document.createElement("div");
      out.className = "mtest-output";
      card.querySelector(".mtest-body").appendChild(out);
    }
    out.textContent = result;
  } catch (err) {
    statusEl.textContent = "Helper failed: " + (err?.message || err);
  }
}

/* ---- wizard engine: one question at a time, verdict computed from answers ---- */

function startWizard(test, card, body) {
  card.open = true;
  const state = { idx: 0, answers: [], findings: [] };
  // Auto-run the helper so the evidence is on screen while answering.
  if (test.helper) runManualHelper(test, card);
  renderWizardStep(test, card, body, state);
}

function renderWizardStep(test, card, body, state) {
  body.textContent = "";

  if (state.idx >= test.questions.length) {
    finishWizard(test, card, body, state);
    return;
  }

  const q = test.questions[state.idx];

  const progress = document.createElement("div");
  progress.className = "wizard-progress";
  progress.textContent = `${t("question")} ${state.idx + 1} / ${test.questions.length}`;
  body.appendChild(progress);

  const question = document.createElement("p");
  question.className = "wizard-question";
  question.textContent = q.q;
  body.appendChild(question);

  const actions = document.createElement("div");
  actions.className = "mtest-actions";

  const yesBtn = document.createElement("button");
  yesBtn.className = "wiz-yes";
  yesBtn.textContent = "✓ " + t("yes");
  yesBtn.addEventListener("click", () => {
    state.answers.push("yes");
    state.idx++;
    renderWizardStep(test, card, body, state);
  });

  const noBtn = document.createElement("button");
  noBtn.className = "wiz-no";
  noBtn.textContent = "✗ " + t("no");
  noBtn.addEventListener("click", () => renderFindingForm(test, card, body, state, q));

  const skipBtn = document.createElement("button");
  skipBtn.textContent = t("skip");
  skipBtn.addEventListener("click", () => {
    state.answers.push("skip");
    state.idx++;
    renderWizardStep(test, card, body, state);
  });

  actions.append(yesBtn, noBtn, skipBtn);
  body.appendChild(actions);
}

// After a "No": capture an optional note and an optional element from the page.
function renderFindingForm(test, card, body, state, q) {
  body.textContent = "";

  const heading = document.createElement("p");
  heading.className = "wizard-question";
  heading.textContent = "❌ " + q.finding;
  body.appendChild(heading);

  const note = document.createElement("input");
  note.type = "text";
  note.className = "wizard-note";
  note.placeholder = t("noteHint");
  body.appendChild(note);

  const pickedEl = document.createElement("div");
  pickedEl.className = "wizard-picked";
  body.appendChild(pickedEl);

  let pickedSelector = null;
  let pickPoll = null;

  const actions = document.createElement("div");
  actions.className = "mtest-actions";

  const pickBtn = document.createElement("button");
  pickBtn.textContent = t("pickElement");
  pickBtn.addEventListener("click", async () => {
    try {
      await bg("pickStart");
      pickedEl.textContent = t("picking");
      clearInterval(pickPoll);
      let tries = 0;
      pickPoll = setInterval(async () => {
        tries++;
        try {
          const sel = await bg("pickCheck");
          if (sel) {
            clearInterval(pickPoll);
            pickedSelector = sel;
            pickedEl.textContent = "";
            const codeEl = document.createElement("code");
            codeEl.textContent = sel;
            pickedEl.append("📌 ", codeEl);
          } else if (tries > 60) {
            clearInterval(pickPoll);
            pickedEl.textContent = "";
          }
        } catch (_) {
          clearInterval(pickPoll);
        }
      }, 500);
    } catch (err) {
      pickedEl.textContent = "Pick failed: " + (err?.message || err);
    }
  });

  const contBtn = document.createElement("button");
  contBtn.className = "wiz-no";
  contBtn.textContent = t("continueBtn");
  contBtn.addEventListener("click", () => {
    clearInterval(pickPoll);
    state.answers.push("no");
    state.findings.push({
      q: q.q,
      finding: q.finding,
      note: note.value.trim(),
      selector: pickedSelector,
    });
    state.idx++;
    renderWizardStep(test, card, body, state);
  });

  actions.append(pickBtn, contBtn);
  body.appendChild(actions);
  note.focus();
}

async function finishWizard(test, card, body, state) {
  const fails = state.answers.filter((a) => a === "no").length;
  const yeses = state.answers.filter((a) => a === "yes").length;
  const verdict = fails ? "fail" : yeses === test.questions.length ? "pass" : "na";

  manualState.verdicts[test.id] = verdict;
  manualState.findings[test.id] = state.findings;
  await saveManual();

  card.dataset.verdict = verdict;
  card.querySelector(".verdict-icon").textContent = verdictIcon(verdict);
  updateManualProgress();

  body.textContent = "";
  const summary = document.createElement("p");
  summary.className = "wizard-question";
  summary.textContent =
    verdict === "pass" ? `✅ ${t("pass")} — all ${yeses} checks passed.` :
    verdict === "fail" ? `❌ ${t("fail")} — ${fails} issue(s) recorded.` :
    `➖ ${t("na")} — some questions were skipped and none failed.`;
  body.appendChild(summary);

  const doneBtn = document.createElement("button");
  doneBtn.textContent = t("done");
  doneBtn.addEventListener("click", () => renderCardIntro(test, card, body));
  body.appendChild(doneBtn);

  // Show recorded findings immediately below the summary.
  if (state.findings.length) {
    const list = document.createElement("div");
    list.className = "wizard-findings";
    for (const f of state.findings) {
      const item = document.createElement("div");
      item.className = "wizard-finding";
      item.textContent = "❌ " + f.finding + (f.note ? ` — ${f.note}` : "");
      if (f.selector) {
        const codeEl = document.createElement("code");
        codeEl.textContent = f.selector;
        codeEl.addEventListener("click", () => highlight([f.selector]));
        item.appendChild(document.createElement("br"));
        item.appendChild(codeEl);
      }
      list.appendChild(item);
    }
    body.appendChild(list);
  }
}

function updateManualProgress() {
  const done = Object.keys(manualState.verdicts).length;
  manualProgressEl.textContent = done ? `(${done}/${MANUAL_TESTS.length})` : "";
}

function manualResultsForExport() {
  if (!Object.keys(manualState.verdicts).length) return null;
  return MANUAL_TESTS.map((test) => ({
    id: test.id,
    title: test.title,
    wcag: test.wcag,
    verdict: manualState.verdicts[test.id] || "not tested",
    findings: manualState.findings[test.id] || [],
  }));
}

/* ---------------- export ---------------- */

function exportReport(format) {
  if (!lastReport) return;
  const base = "a11y-lens-" + safeName(lastReport.url) + "-" +
    lastReport.scannedAt.slice(0, 19).replace(/[:T]/g, "-");
  if (format === "json") {
    const payload = { ...lastReport, manualTests: manualResultsForExport() };
    download(base + ".json", "application/json", JSON.stringify(payload, null, 2));
  } else if (format === "csv") {
    download(base + ".csv", "text/csv", toCsv(lastReport));
  } else if (format === "html") {
    download(base + ".html", "text/html", toHtml(lastReport));
  } else if (format === "issues") {
    download(base + "-issues.md", "text/markdown", A11yFixes.issuesMarkdown(lastReport, manualResultsForExport()));
  }
}

function safeName(url) {
  try {
    return new URL(url).hostname.replace(/[^a-z0-9.-]/gi, "_") || "page";
  } catch (_) {
    return "page";
  }
}

function download(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function csvEscape(s) {
  return '"' + String(s ?? "").replace(/"/g, '""') + '"';
}

function toCsv(report) {
  const rows = [["rule", "impact", "help", "helpUrl", "selector", "html", "failureSummary"]];
  for (const v of report.violations) {
    for (const n of v.nodes) {
      rows.push([v.id, v.impact, v.help, v.helpUrl, n.target.join(" "), n.html, n.failureSummary]);
    }
  }
  const manual = manualResultsForExport();
  if (manual) {
    rows.push([]);
    rows.push(["manual test", "verdict", "wcag", "finding", "selector", "note", ""]);
    for (const m of manual) {
      if (!m.findings.length) {
        rows.push([m.title, m.verdict, m.wcag, "", "", "", ""]);
      } else {
        for (const f of m.findings) {
          rows.push([m.title, m.verdict, m.wcag, f.finding, f.selector || "", f.note || "", ""]);
        }
      }
    }
  }
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

function escHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function toHtml(report) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of report.violations) counts[v.impact] = (counts[v.impact] || 0) + v.nodeTotal;
  const impactColor = { critical: "#d32f2f", serious: "#e65100", moderate: "#f9a825", minor: "#616161" };

  const sections = report.violations.map((v) => `
    <section style="border:1px solid #ddd;border-left:5px solid ${impactColor[v.impact]};border-radius:6px;margin:14px 0;padding:12px 16px">
      <h2 style="margin:0 0 4px;font-size:16px">${escHtml(v.help)}
        <small style="color:${impactColor[v.impact]};text-transform:uppercase">${v.impact}</small>
        <small style="color:#888">— ${v.nodeTotal} element(s)</small></h2>
      <p style="margin:4px 0 10px;color:#555">${escHtml(v.description)}
        <a href="${escHtml(v.helpUrl)}">Learn more</a></p>
      ${v.nodes.map((n) => `
        <div style="border-top:1px solid #eee;padding:8px 0">
          <code style="display:block;background:#f6f6f6;padding:6px 8px;border-radius:4px;white-space:pre-wrap;word-break:break-all">${escHtml((n.pageLabel ? "[" + n.pageLabel + "] " : "") + n.html)}</code>
          <div style="color:#777;font-size:13px;white-space:pre-wrap;margin-top:4px">${escHtml(n.failureSummary)}</div>
        </div>`).join("")}
    </section>`).join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>A11y Lens report — ${escHtml(report.url)}</title></head>
<body style="font:14px/1.5 system-ui,sans-serif;max-width:900px;margin:30px auto;padding:0 16px">
  <h1 style="font-size:22px">🔍 A11y Lens report</h1>
  <p><b>Page:</b> ${escHtml(report.url)}<br>
     <b>Scanned:</b> ${escHtml(report.scannedAt)}<br>
     <b>Rule set:</b> ${escHtml(report.ruleSet)}</p>
  <p>
    <b style="color:#d32f2f">${counts.critical} critical</b> ·
    <b style="color:#e65100">${counts.serious} serious</b> ·
    <b style="color:#f9a825">${counts.moderate} moderate</b> ·
    <b style="color:#616161">${counts.minor} minor</b> ·
    <b style="color:#2e7d32">${report.passes} checks passed</b>
  </p>
  ${sections || "<p>🎉 No violations found by automated checks.</p>"}
  ${manualSectionHtml()}
  <hr><p style="color:#999;font-size:12px">Generated by A11y Lens (axe-core). Automated checks cover only part of WCAG — manual testing still required.</p>
</body></html>`;
}

function manualSectionHtml() {
  const results = manualResultsForExport();
  if (!results) return "";
  const color = { pass: "#2e7d32", fail: "#d32f2f", na: "#616161", "not tested": "#999" };
  const label = { pass: "PASS", fail: "FAIL", na: "N/A", "not tested": "not tested" };
  const rows = results.map((r) => `
    <tr>
      <td style="padding:4px 10px;border-bottom:1px solid #eee;vertical-align:top">${escHtml(r.title)}</td>
      <td style="padding:4px 10px;border-bottom:1px solid #eee;color:#888;vertical-align:top">${escHtml(r.wcag)}</td>
      <td style="padding:4px 10px;border-bottom:1px solid #eee;font-weight:700;color:${color[r.verdict]};vertical-align:top">${label[r.verdict]}</td>
      <td style="padding:4px 10px;border-bottom:1px solid #eee">${r.findings.map((f) =>
        `❌ ${escHtml(f.finding)}${f.note ? " — " + escHtml(f.note) : ""}${f.selector ? `<br><code>${escHtml(f.selector)}</code>` : ""}`
      ).join("<br>") || "—"}</td>
    </tr>`).join("");
  return `
  <h2 style="font-size:18px;margin-top:30px">🧭 Guided manual tests</h2>
  <table style="border-collapse:collapse;width:100%">
    <tr><th style="text-align:left;padding:4px 10px">Test</th>
        <th style="text-align:left;padding:4px 10px">WCAG</th>
        <th style="text-align:left;padding:4px 10px">Verdict</th>
        <th style="text-align:left;padding:4px 10px">Findings</th></tr>
    ${rows}
  </table>`;
}

/* ---------------- help ---------------- */

const HELP_TOPICS = [
  {
    icon: "▶", title: "Scan this page",
    what: "Injects axe-core (the open-source engine behind axe DevTools and Lighthouse) into the inspected page and runs an automated WCAG audit.",
    benefit: "In seconds you get every machine-detectable violation, sorted by severity, each with the offending HTML, an explanation, and a link to the fix.",
    example: "You inherit a legacy page. One scan tells you it has 3 critical issues (missing form labels, no alt text), so you know exactly where to start.",
  },
  {
    icon: "🎚", title: "Rule set picker & best practices",
    what: "The dropdown limits the scan to a WCAG conformance level (2.0 A up to 2.2 AA) or runs every rule. The checkbox adds axe's 'best practice' rules that aren't strictly required by WCAG. Your choice is saved as the default.",
    benefit: "Match the scan to your actual legal/contract target — no noise from rules you're not accountable for.",
    example: "A government client requires WCAG 2.1 AA. Pick '2.1 AA', scan, and the report maps 1-to-1 to what the auditor will check.",
  },
  {
    icon: "⏺", title: "Record flow (user flow analysis)",
    what: "While recording, the page is re-scanned on an interval and after every navigation. All findings are merged into one de-duplicated report, each labeled with the page it came from, like [/cart].",
    benefit: "A single scan only sees the page as it looks right now. Flows catch what hides in temporary states: open menus, modals, form errors, and later pages of a journey.",
    example: "Auditing a checkout: press ⏺ on the product page → open the size dropdown, add to cart → cart → checkout → submit the form empty → press ■ Stop. One report covers all five states.",
  },
  {
    icon: "◉", title: "Highlighting & Inspect",
    what: "Click any HTML snippet in a finding to outline that element on the page. 'Highlight all' outlines every violating element at once, color-coded by severity. 'Inspect' jumps to the element in the Elements panel.",
    benefit: "Turns an abstract report row into a thing you can see and fix.",
    example: "A finding says 'links must have discernible text' — clicking it reveals an invisible icon-link in the footer you'd never find by reading the report alone.",
  },
  {
    icon: "◐", title: "Contrast checker",
    what: "An eyedropper that samples any pixel on your screen — pick a text color and background, get the WCAG ratio with AA/AAA pass/fail badges.",
    benefit: "Automated scans can't measure text over images or gradients. The eyedropper works anywhere — even on a Figma mockup in another window.",
    example: "A designer proposes gray #999 on white. Two clicks show 2.85:1 — fails AA (needs 4.5:1). Caught before it ships.",
  },
  {
    icon: "⬇", title: "Export (JSON / CSV / HTML)",
    what: "Downloads the last scan plus your manual test verdicts and findings as JSON, CSV (one row per element), or a styled standalone HTML report.",
    benefit: "Findings become shareable artifacts: attach the HTML to a ticket, import the CSV into a sheet, diff the JSON in CI.",
    example: "Your PM asks 'how bad is it?'. You send the HTML report — totals up top, every violation explained — no extension needed.",
  },
  {
    icon: "🕘", title: "Scan history & NEW badges",
    what: "Each URL's last scan is stored locally. The next scan shows 'N new · M fixed' versus last time, and previously-unseen findings get a NEW badge.",
    benefit: "Answers the two questions that matter while fixing: did my change fix it, and did I break anything else?",
    example: "You fix 5 alt-text issues and rescan: '0 new · 5 fixed'. Next week a teammate's banner shows '3 new' — a regression caught same-day.",
  },
  {
    icon: "⚠", title: "Stale results banner",
    what: "After a scan, a watcher observes the page. If the DOM changes or the page navigates, a banner warns that results may be stale.",
    benefit: "Prevents debugging against an outdated report after the page re-rendered.",
    example: "You scan, then log in. The banner reminds you the logged-in view needs its own scan.",
  },
  {
    icon: "🧙", title: "Guided manual tests (wizards)",
    what: "Ten guided tests for what automation can't judge. Each runs as a wizard: one yes/no question at a time, the verdict computed from your answers. Every 'No' is recorded as a specific finding — optionally with a note and an element you pick directly on the page.",
    benefit: "Automated tools catch only ~30–50% of WCAG. The wizards structure the rest so a non-expert can do a credible audit, and the findings land in your exports next to the automated ones.",
    example: "In the keyboard wizard you answer 'No' to 'Could you Tab out of every widget?', click 📌, click the trapped modal on the page — the report now contains 'Keyboard trap detected' with that element's selector.",
  },
  {
    icon: "🔧", title: "Fix suggestions, Preview fix & AI fix",
    what: "Findings now include a ready-to-paste corrected snippet built from the element's actual HTML (Plain HTML, React/JSX, or Vue — set the framework in Options). Contrast failures get a computed nearest passing color. 'Preview fix' applies the change live on the page (with Undo) so you can re-scan and confirm before touching source. Optional '🤖 AI fix' sends the single offending snippet to the Claude API using your own key from Options. The 'Issues' export produces GitHub-ready markdown, and the CI companion prints the same suggestions with --suggest.",
    benefit: "The tool stops at 'here's what's broken' for most scanners — this closes the loop to 'here's the fix, see it working, paste it'.",
    example: "A contrast finding says #9e9e9e fails on white. The suggestion shows 'color: #757575' (4.61:1 ✓, same hue). Preview fix recolors the live page, a re-scan passes, you copy the one-line CSS change into your stylesheet.",
  },
  {
    icon: "⌨", title: "Keyboard shortcuts & options",
    what: "In the panel: S = scan, R = record/stop flow, X = clear highlights, C = contrast, 1/2/3 = switch tabs. The extension options page (right-click the toolbar icon → Options) sets the default WCAG level, flow scan interval, and language (English/العربية with RTL layout).",
    benefit: "Faster daily use, and defaults that match how your team works.",
    example: "Set Arabic in Options and the panel chrome flips to RTL for colleagues who prefer it.",
  },
  {
    icon: "⚖", title: "What automation can't do",
    what: "axe-core's rules are conservative by design: they only report what is provably wrong, so there are near-zero false positives.",
    benefit: "You can trust every automated finding — but a clean scan is NOT proof of accessibility. Roughly half of WCAG needs human judgment.",
    example: "alt=\"image123.jpg\" passes the automated check but fails a real user. That's what the wizards are for — run both before calling a page accessible.",
  },
];

let helpRendered = false;
function renderHelp() {
  if (helpRendered) return;
  helpRendered = true;
  for (const topic of HELP_TOPICS) {
    const det = document.createElement("details");
    det.className = "help-card";
    const sum = document.createElement("summary");
    sum.textContent = `${topic.icon} ${topic.title}`;
    det.appendChild(sum);
    const body = document.createElement("div");
    body.className = "help-card-body";
    const what = document.createElement("p");
    what.textContent = topic.what;
    const benefit = document.createElement("p");
    benefit.className = "benefit";
    const bb = document.createElement("b");
    bb.textContent = "Why it helps: ";
    benefit.append(bb, topic.benefit);
    const example = document.createElement("p");
    example.className = "example";
    const eb = document.createElement("b");
    eb.textContent = "Example: ";
    example.append(eb, topic.example);
    body.append(what, benefit, example);
    det.appendChild(body);
    helpListEl.appendChild(det);
  }
}
