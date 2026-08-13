// Works on Chromium (chrome.*) and Firefox (browser.*, promise-based).
const EXT = globalThis.browser || globalThis.chrome;
const tabId = EXT.devtools.inspectedWindow.tabId;

/* ---------------- background messaging ----------------
   DevTools pages cannot use EXT.scripting / EXT.storage.
   All page injection and storage goes through background.js. */

async function bg(op, extra = {}) {
  // Promise-form sendMessage works on Chromium MV3 and Firefox alike.
  const res = await EXT.runtime.sendMessage({ op, tabId, ...extra });
  if (res && res.error) throw new Error(res.error);
  return res ? res.result : undefined;
}

// inspectedWindow.eval is callback-based on Chromium, promise-based on Firefox.
function devEval(expr) {
  return new Promise((resolve) => {
    try {
      const maybe = EXT.devtools.inspectedWindow.eval(expr, (result) => resolve(result));
      if (maybe && typeof maybe.then === "function") {
        maybe.then((r) => resolve(Array.isArray(r) ? r[0] : r)).catch(() => resolve(null));
      }
    } catch (_) {
      resolve(null);
    }
  });
}

/* ---------------- i18n ---------------- */

const STR = {
  en: {
    scan: "▶ Scan this page", scanShort: "Scan",
    flow: "⏺ Record flow", stopFlow: "■ Stop flow",
    clear: "✕ Clear highlights", contrast: "◐ Contrast",
    highlightAll: "◉ Highlight all",
    tabAuto: "Automated", tabDls: "🇦🇪 DLS", tabManual: "🧭 Manual tests", tabHelp: "❓ Help",
    runDls: "🇦🇪 Run DLS check",
    modeA11y: "Accessibility", modeBoth: "Accessibility + DLS", modeDls: "DLS only",
    reset: "↺ Reset", resetDone: "Cleared — ready for a fresh audit.",
    dlsInOtherTab: (p, t) => ` · DLS: ${p}/${t} — see the 🇦🇪 tab`,
    dlsIntro: "Audit this page against the UAE Design System (AEGov DLS v3 — mandated for federal government entities).",
    findings: "🔎 Findings", historySec: "📈 History",
    filterPlaceholder: "🔍 Filter by rule, impact, or selector…",
    filterCount: (s, t) => `${s} of ${t} rule(s)`,
    scanningBig: "Scanning… large pages can take several seconds.",
    scanningHuge: (n, s) => `Scanning ${n.toLocaleString()} elements — this may take ~${s}s on a page this large…`,
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
    tabAuto: "الفحص الآلي", tabDls: "🇦🇪 نظام التصميم", tabManual: "🧭 اختبارات يدوية", tabHelp: "❓ مساعدة",
    runDls: "🇦🇪 تشغيل فحص نظام التصميم",
    modeA11y: "إمكانية الوصول", modeBoth: "إمكانية الوصول + نظام التصميم", modeDls: "نظام التصميم فقط",
    reset: "↺ إعادة تعيين", resetDone: "تم المسح — جاهز لتدقيق جديد.",
    dlsInOtherTab: (p, t) => ` · نظام التصميم: ${p}/${t} — انظر تبويب 🇦🇪`,
    dlsIntro: "دقق هذه الصفحة وفق نظام التصميم الإماراتي (AEGov DLS v3 — الإلزامي للجهات الاتحادية).",
    findings: "🔎 النتائج", historySec: "📈 السجل",
    filterPlaceholder: "🔍 رشّح حسب القاعدة أو الخطورة أو المحدد…",
    filterCount: (s, t) => `${s} من ${t} قاعدة`,
    scanningBig: "جارٍ الفحص… الصفحات الكبيرة قد تستغرق عدة ثوانٍ.",
    scanningHuge: (n, s) => `جارٍ فحص ${n.toLocaleString()} عنصر — قد يستغرق نحو ${s} ثانية لصفحة بهذا الحجم…`,
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
const t = (key, ...args) => {
  const v = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
  return typeof v === "function" ? v(...args) : v;
};

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
const autoView = document.getElementById("auto");
const modeSelect = document.getElementById("modeSelect");
const filterRow = document.getElementById("filterRow");
const filterInput = document.getElementById("filterInput");
const filterCount = document.getElementById("filterCount");
const resetBtn = document.getElementById("resetBtn");
const dlsView = document.getElementById("dlsView");
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
  modeSelect.value = settings.mode || "a11y";
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
  tabsNav.querySelector("[data-view='dls']").textContent = t("tabDls");
  tabsNav.querySelector("[data-view='help']").textContent = t("tabHelp");
  document.getElementById("dlsBtn").textContent = t("runDls");
  document.getElementById("dlsIntro").textContent = t("dlsIntro");
  document.getElementById("resultsSummaryLabel").textContent = t("findings");
  document.querySelector("#historySection > .section-summary").textContent = t("historySec");
  document.querySelector("#results .empty").textContent = t("emptyResults");
  staleEl.textContent = t("stale");
  document.getElementById("pickFg").textContent = t("pickFg");
  document.getElementById("pickBg").textContent = t("pickBg");
  document.querySelector("label.check").lastChild.textContent = " " + t("bestPractices");
  resetBtn.textContent = t("reset");
  const modeOpts = modeSelect.querySelectorAll("option");
  modeOpts[0].textContent = t("modeA11y");
  modeOpts[1].textContent = t("modeBoth");
  modeOpts[2].textContent = t("modeDls");
}

init();

/* ---------------- event wiring ---------------- */

scanBtn.addEventListener("click", runScanFlow);
modeSelect.addEventListener("change", () => bg("settingsSet", { value: { mode: modeSelect.value } }).catch(() => {}));
resetBtn.addEventListener("click", resetAll);
filterInput.addEventListener("input", applyFilter);

function applyFilter() {
  const q = filterInput.value.trim().toLowerCase();
  const cards = resultsEl.querySelectorAll("details.violation");
  let shown = 0;
  for (const card of cards) {
    const match = !q || card.dataset.search.includes(q);
    card.hidden = !match;
    if (match) shown++;
  }
  filterCount.textContent = t("filterCount", shown, cards.length);
}

// Spinner + message while a long operation runs.
function statusBusy(msg) {
  statusEl.textContent = "";
  const sp = document.createElement("span");
  sp.className = "spin";
  statusEl.append(sp, " " + msg);
}

// One Scan button drives the selected audit mode; reports stay unified in exports.
async function runScanFlow() {
  const mode = modeSelect.value;
  if (mode === "dls") {
    showView("dls");
    await runDlsCheck();
    return;
  }
  await runScan();
  if (mode === "both") {
    const scanStatus = statusEl.textContent;
    await runDlsCheck();
    statusEl.textContent = scanStatus + (lastDlsExport
      ? t("dlsInOtherTab", lastDlsExport.score.passed, lastDlsExport.score.total) : "");
  }
}

function resetAll() {
  clearHighlights();
  lastReport = null;
  lastDlsExport = null;
  summaryEl.hidden = true;
  document.getElementById("historySection").hidden = true;
  staleEl.hidden = true;
  clearInterval(stalePoll);
  exportGroup.hidden = true;
  highlightAllBtn.hidden = true;
  autofixBtn.hidden = true;
  dlsReportEl.hidden = true;
  dlsReportEl.textContent = "";
  diffEl.textContent = "";
  filterRow.hidden = true;
  resultsEl.textContent = "";
  const p = document.createElement("p");
  p.className = "empty";
  p.textContent = t("emptyResults");
  resultsEl.appendChild(p);
  showView("auto");
  statusEl.textContent = t("resetDone");
}
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
  else if (k === "2") showView("dls");
  else if (k === "3") showView("manual");
  else if (k === "4") showView("help");
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
  autoView.hidden = view !== "auto";
  dlsView.hidden = view !== "dls";
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
  statusBusy(t("scanningBig"));
  try {
    // Pre-count the DOM so heavy pages (e.g. large storefronts) get an honest estimate.
    try {
      const n = await bg("domCount");
      if (n > 4000) statusBusy(t("scanningHuge", n, Math.max(5, Math.round(n / 450))));
    } catch (_) {}
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
    det.dataset.search = (v.id + " " + v.help + " " + v.impact + " " +
      v.nodes.map((n) => n.target.join(" ") + " " + n.html).join(" ")).toLowerCase();
    resultsEl.appendChild(det);
  }
  filterRow.hidden = false;
  filterInput.value = "";
  filterInput.placeholder = t("filterPlaceholder");
  applyFilter();
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
    // Append this run to the per-URL trend series (kept to the last 30 scans).
    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of report.violations) counts[v.impact] = (counts[v.impact] || 0) + v.nodeTotal;
    const prevStored = await bg("storeGet", { key: storageKey }).catch(() => null);
    const runs = [...((prevStored && prevStored.runs) || []),
      { at: report.scannedAt, ...counts }].slice(-30);
    await bg("storeSet", { key: storageKey, value: { keys: currentKeys, scannedAt: report.scannedAt, runs } });
    drawHistoryChart(runs);
  } catch (err) {
    console.error("history diff failed", err);
    diffEl.textContent = "";
  }
}

const IMPACT_COLORS = { critical: "#d32f2f", serious: "#e65100", moderate: "#f9a825", minor: "#9e9e9e" };

function drawHistoryChart(runs) {
  const wrap = document.getElementById("historySection");
  if (!runs || runs.length < 2) { wrap.hidden = true; return; }
  wrap.hidden = false;
  const canvas = document.getElementById("historyChart");
  const W = (canvas.width = Math.max(320, (autoView.clientWidth || 620) - 40));
  const H = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  const max = Math.max(1, ...runs.map((r) => r.critical + r.serious + r.moderate + r.minor));
  const x = (i) => 6 + (i * (W - 12)) / (runs.length - 1);
  const y = (v) => H - 8 - (v / max) * (H - 16);
  for (const impact of ["minor", "moderate", "serious", "critical"]) {
    ctx.beginPath();
    ctx.strokeStyle = IMPACT_COLORS[impact];
    ctx.lineWidth = impact === "critical" ? 2 : 1.25;
    runs.forEach((r, i) => (i ? ctx.lineTo(x(i), y(r[impact])) : ctx.moveTo(x(0), y(r[impact]))));
    ctx.stroke();
    runs.forEach((r, i) => {
      ctx.beginPath();
      ctx.fillStyle = IMPACT_COLORS[impact];
      ctx.arc(x(i), y(r[impact]), 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  const legend = document.getElementById("historyLegend");
  legend.textContent = "";
  const first = runs[0], last = runs[runs.length - 1];
  const total = (r) => r.critical + r.serious + r.moderate + r.minor;
  const delta = total(last) - total(first);
  const span = document.createElement("span");
  span.textContent = `${runs.length} scans · ${total(first)} → ${total(last)} violations ` +
    (delta < 0 ? `(▼ ${-delta} fixed)` : delta > 0 ? `(▲ ${delta} more)` : "(no change)");
  span.style.color = delta < 0 ? "var(--passes)" : delta > 0 ? "var(--critical)" : "";
  legend.appendChild(span);
}

/* ---------------- highlight / inspect ---------------- */

function highlight(target) {
  bg("highlight", { selector: target[0] }).catch(() => {});
}

async function highlightAll() {
  if (!lastReport) return;
  const items = [];
  for (const v of lastReport.violations) {
    for (const n of v.nodes) items.push({ sel: n.target[0], impact: v.impact });
  }
  try {
    await bg("highlightAll", { items });
    // In a DLS-inclusive mode, layer the gold DLS gap outlines on top.
    if (modeSelect.value !== "a11y" && lastDlsExport) await bg("dlsHighlight");
  } catch (_) {}
}

function clearHighlights() {
  bg("clearHighlights").catch(() => {});
}

function inspectElement(selector) {
  devEval(`inspect(document.querySelector(${JSON.stringify(selector)}))`);
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

EXT.devtools.network.onNavigated.addListener(() => {
  clearInterval(stalePoll);
  // A DLS report always belongs to one page — drop it on navigation so a stale
  // report can't be read or exported against the new page.
  dlsReportEl.hidden = true;
  dlsReportEl.textContent = "";
  lastDlsExport = null;
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
  return devEval("location.href").then((res) => res || "unknown");
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
  for (const test of MANUAL_TESTS.map(localizeTest)) {
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

async function exportReport(format) {
  if (!lastReport) return;
  const base = "a11y-lens-" + safeName(lastReport.url) + "-" +
    lastReport.scannedAt.slice(0, 19).replace(/[:T]/g, "-");
  if (format === "json") {
    const payload = { ...withSuggestions(lastReport), manualTests: manualResultsForExport(), dls: lastDlsExport };
    download(base + ".json", "application/json", JSON.stringify(payload, null, 2));
  } else if (format === "csv") {
    download(base + ".csv", "text/csv", toCsv(lastReport));
  } else if (format === "html" || format === "pdf") {
    const shot = await captureScanShot();
    const dlsShot = await captureDlsShot();
    await bg("clearHighlights").catch(() => {});
    let html = toHtml(lastReport, shot, dlsShot);
    if (format === "pdf") {
      // Print-ready report in a new tab; the user saves as PDF from the print dialog.
      html = html.replace(
        "</body>",
        "<script>addEventListener('load',()=>setTimeout(()=>print(),400))<\/script></body>"
      );
      window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })));
      statusEl.textContent = "Report opened in a new tab — choose 'Save as PDF' in the print dialog.";
    } else {
      download(base + ".html", "text/html", html);
    }
  } else if (format === "issues") {
    download(base + "-issues.md", "text/markdown", A11yFixes.issuesMarkdown(lastReport, manualResultsForExport()));
  }
}

// When a DLS report exists, outline its gaps and capture a second screenshot
// so combined-mode exports carry visual evidence for both audits.
async function captureDlsShot() {
  if (!lastDlsExport) return null;
  try {
    await bg("clearHighlights");
    await bg("dlsHighlight");
    await new Promise((r) => setTimeout(r, 400));
    return await bg("captureTab");
  } catch (_) {
    return null;
  }
}

// Outline all violations on the page, then capture the visible tab so the
// report carries visual evidence. Returns null when unavailable.
async function captureScanShot() {
  if (!lastReport || !lastReport.violations.length) return null;
  if (lastReport.url.startsWith("user flow")) return null;
  try {
    const items = [];
    for (const v of lastReport.violations) {
      for (const n of v.nodes) items.push({ sel: n.target[0], impact: v.impact });
    }
    await bg("highlightAll", { items });
    await new Promise((r) => setTimeout(r, 400));
    return await bg("captureTab");
  } catch (_) {
    return null;
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

// Attach the suggested fix (per current framework setting) to every node.
function withSuggestions(report) {
  const fw = settings.framework || "html";
  return {
    ...report,
    violations: report.violations.map((v) => ({
      ...v,
      nodes: v.nodes.map((n) => {
        const fix = A11yFixes.suggestFix(v.id, n, fw);
        return fix ? { ...n, suggestedFix: fix.snippet, fixNote: fix.note } : n;
      }),
    })),
  };
}

function csvEscape(s) {
  return '"' + String(s ?? "").replace(/"/g, '""') + '"';
}

function toCsv(report) {
  const fw = settings.framework || "html";
  const rows = [["rule", "impact", "help", "helpUrl", "selector", "html", "failureSummary", "suggestedFix"]];
  for (const v of report.violations) {
    for (const n of v.nodes) {
      const fix = A11yFixes.suggestFix(v.id, n, fw);
      rows.push([v.id, v.impact, v.help, v.helpUrl, n.target.join(" "), n.html, n.failureSummary, fix ? fix.snippet : ""]);
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

function toHtml(report, shot, dlsShot) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of report.violations) counts[v.impact] = (counts[v.impact] || 0) + v.nodeTotal;
  const impactColor = { critical: "#d32f2f", serious: "#e65100", moderate: "#f9a825", minor: "#616161" };

  const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const sortedRules = [...report.violations].sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
  const ruleIndex = sortedRules.length < 2 ? "" : `
  <h2 style="font-size:16px;margin-top:20px">Rule summary</h2>
  <table style="border-collapse:collapse;width:100%;font-size:13px">
    <tr><th style="text-align:left;padding:3px 10px">Rule</th><th style="text-align:left;padding:3px 10px">Impact</th><th style="text-align:left;padding:3px 10px">Elements</th></tr>
    ${sortedRules.map((v) => `
    <tr>
      <td style="padding:3px 10px;border-bottom:1px solid #eee"><a href="#rule-${escHtml(v.id)}">${escHtml(v.help)}</a></td>
      <td style="padding:3px 10px;border-bottom:1px solid #eee;font-weight:700;color:${impactColor[v.impact]}">${v.impact}</td>
      <td style="padding:3px 10px;border-bottom:1px solid #eee">${v.nodeTotal}</td>
    </tr>`).join("")}
  </table>`;
  const shotHtml = shot ? `
  <h2 style="font-size:16px;margin-top:20px">${escHtml(dt("scanShotNote"))}</h2>
  <img src="${shot}" style="max-width:100%;border:1px solid #ddd;border-radius:6px">` : "";

  const sections = sortedRules.map((v) => `
    <section id="rule-${escHtml(v.id)}" style="border:1px solid #ddd;border-left:5px solid ${impactColor[v.impact]};border-radius:6px;margin:14px 0;padding:12px 16px">
      <h2 style="margin:0 0 4px;font-size:16px">${escHtml(v.help)}
        <small style="color:${impactColor[v.impact]};text-transform:uppercase">${v.impact}</small>
        <small style="color:#888">— ${v.nodeTotal} element(s)</small></h2>
      <p style="margin:4px 0 10px;color:#555">${escHtml(v.description)}
        <a href="${escHtml(v.helpUrl)}">Learn more</a></p>
      ${v.nodes.map((n) => {
        const fix = A11yFixes.suggestFix(v.id, n, settings.framework || "html");
        return `
        <div style="border-top:1px solid #eee;padding:8px 0">
          <div style="font-size:12px;color:#555;margin-bottom:3px">Selector: <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(n.target.join(" "))}</code></div>
          <code style="display:block;background:#f6f6f6;padding:6px 8px;border-radius:4px;white-space:pre-wrap;word-break:break-all">${escHtml((n.pageLabel ? "[" + n.pageLabel + "] " : "") + n.html)}</code>
          <div style="color:#777;font-size:13px;white-space:pre-wrap;margin-top:4px">${escHtml(n.failureSummary)}</div>
          ${fix ? `
          <div style="border-left:4px solid #2e7d32;background:#f2f8f2;border-radius:4px;padding:6px 10px;margin-top:6px">
            <div style="color:#2e7d32;font-weight:700;font-size:12px">Suggested fix</div>
            <code style="display:block;white-space:pre-wrap;word-break:break-all;font-size:12px">${escHtml(fix.snippet)}</code>
            <div style="color:#557755;font-size:12px;margin-top:2px">${escHtml(fix.note)}</div>
          </div>` : ""}
        </div>`;
      }).join("")}
    </section>`).join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><title>A11y Lens report — ${escHtml(report.url)}</title></head>
<body style="font:14px/1.5 system-ui,sans-serif;max-width:900px;margin:30px auto;padding:0 16px;background:#fff;color:#1a1a1a">
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
  ${shotHtml}
  ${ruleIndex}
  ${sections || "<p>🎉 No violations found by automated checks.</p>"}
  ${manualSectionHtml()}
  ${dlsSectionHtml(dlsShot)}
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
    icon: "🇦🇪", title: "UAE Design System (DLS) check",
    what: "One click audits the page against the UAE Design System (AEGov DLS v3, designsystem.gov.ae — mandated for federal government entities): aegov- component adoption, the DLS font set (Roboto/Inter for English, Noto Kufi Arabic/Alexandria for Arabic), the 5-weight limit, color-token conformance against the real @aegov/design-system palette (115 tokens), bilingual/RTL requirements, responsive viewport, and the mandated WCAG 2.2 AA level via the scanner.",
    benefit: "FGE teams get an instant answer to 'is this page on the design system, and where does it deviate?' — including which non-token colors are in use and their nearest official token.",
    example: "A ministry microsite scores 3/8: fonts are Open Sans instead of Roboto/Inter, buttons use #1a73e8 (nearest token: techblue-600), and there is no Arabic switcher. The report is the punch list for the vendor.",
  },
  {
    icon: "🔭", title: "WCAG 3.0 readiness",
    what: "WCAG 3.0 ('Silver') is still a W3C draft — no tool can legitimately test against it yet, and axe-core has no WCAG 3 rules because the success criteria aren't final. A11y Lens tracks the stable standards (WCAG 2.0/2.1/2.2, which remain the legal basis worldwide) and will add WCAG 3 scoring when the standard and axe-core support land.",
    benefit: "You can't be caught out: everything this tool reports maps to the standards auditors and regulations actually use today. WCAG 2.2 AA conformance is also the expected on-ramp to WCAG 3 — nothing you fix now is wasted.",
    example: "A client asks 'are we WCAG 3 ready?'. The honest answer this tool supports: 'WCAG 3 is a draft; we conform to WCAG 2.2 AA, which is the current requirement and the foundation WCAG 3 builds on.'",
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
  for (const topic of HELP_TOPICS.map(localizeTopic)) {
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

/* ---------------- Arabic content (manual tests + help) ---------------- */

const MANUAL_AR = {
  keyboard: {
    title: "التنقّل بلوحة المفاتيح فقط",
    why: "كثير من المستخدمين لا يستخدمون الفأرة إطلاقاً. يجب أن يكون كل شيء قابلاً للوصول والتشغيل بلوحة المفاتيح وحدها، دون أي فخاخ.",
    helperLabel: "ترقيم مواضع التنقل",
    questions: [
      ["هل استطعت الوصول إلى كل عنصر تفاعلي باستخدام Tab فقط (والأسهم داخل المكوّنات)؟", "بعض العناصر لا يمكن الوصول إليها بلوحة المفاتيح"],
      ["هل استطعت تفعيل كل عنصر بمفتاح Enter أو المسافة؟", "عناصر لا يمكن تفعيلها بلوحة المفاتيح"],
      ["هل استطعت دائماً الخروج بـ Tab من كل مكوّن — دون فخ لوحة مفاتيح (نوافذ منبثقة، مشغّلات)؟", "تم رصد فخ لوحة مفاتيح"],
      ["هل كل تفاعل يعتمد على الفأرة أو التمرير متاح أيضاً بلوحة المفاتيح؟", "تفاعل يعمل بالفأرة فقط دون بديل للوحة المفاتيح"],
    ],
  },
  "focus-visible": {
    title: "مؤشر تركيز مرئي",
    why: "مستخدمو لوحة المفاتيح المبصرون يجب أن يروا دائماً أي عنصر عليه التركيز.",
    helperLabel: "ترقيم مواضع التنقل",
    questions: [
      ["هل أظهر كل موضع تنقل مؤشر تركيز واضحاً (إطار، حلقة، خط سفلي…)؟", "عناصر تستقبل التركيز دون مؤشر مرئي"],
      ["هل كان المؤشر واضحاً على الخلفية في كل أقسام الصفحة؟", "تباين مؤشر التركيز غير كافٍ في بعض المناطق"],
    ],
  },
  "focus-order": {
    title: "ترتيب تركيز وقراءة منطقي",
    why: "يجب أن يتبع التركيز التدفق البصري للقراءة، وإلا ارتبك مستخدمو لوحة المفاتيح وقارئات الشاشة.",
    helperLabel: "ترقيم مواضع التنقل",
    questions: [
      ["هل تتبع أرقام مواضع التنقل الترتيب البصري لقراءة الصفحة؟", "ترتيب التركيز لا يطابق الترتيب البصري"],
      ["هل لا توجد قفزات مفاجئة (إلى التذييل أو مناطق خارج الشاشة أو محتوى أعيد ترتيبه بـ CSS)؟", "قفزة تركيز غير متوقعة"],
    ],
  },
  headings: {
    title: "بنية العناوين",
    why: "مستخدمو قارئات الشاشة يتنقلون عبر العناوين. يجب أن تصف البنية الصفحة كفهرس محتويات.",
    helperLabel: "عرض مخطط العناوين",
    questions: [
      ["هل يوجد h1 واحد بالضبط يصف غرض الصفحة؟", "h1 مفقود أو متعدد أو غير واضح"],
      ["هل تتداخل مستويات العناوين دون تخطٍّ (h2 ثم h3، وليس h2 ثم h4)؟", "تخطٍّ في مستويات العناوين"],
      ["هل يصف كل عنوان قسمه بدقة (لا عناوين غامضة أو نص عريض يتظاهر بأنه عنوان)؟", "عناوين غير واضحة أو زائفة"],
    ],
  },
  landmarks: {
    title: "المعالم ورابط التخطي",
    why: "المعالم (header, nav, main, footer) ورابط التخطي يتيحان لمستخدمي التقنيات المساعدة تجاوز المحتوى المتكرر.",
    helperLabel: "تحديد المعالم",
    questions: [
      ["هل المحتوى الرئيسي داخل معلم main واحد بالضبط؟", "المحتوى ليس داخل معلم main واحد"],
      ["هل أول موضع Tab هو رابط «تخطّ إلى المحتوى» يعمل فعلاً؟", "لا يوجد رابط تخطٍّ يعمل"],
      ["هل تحمل المعالم المتكررة (مثل قائمتي تنقل) تسميات مميِّزة؟", "معالم مكررة دون تسميات"],
    ],
  },
  "alt-quality": {
    title: "جودة النص البديل للصور",
    why: "الفحص الآلي يكتشف غياب سمة alt، لكنه لا يحكم على جودة النص نفسه.",
    helperLabel: "عرض النصوص البديلة",
    questions: [
      ["هل ينقل النص البديل لكل صورة معلوماتية المعلومات نفسها التي تنقلها الصورة؟", "النص البديل لا ينقل معلومات الصورة"],
      ["هل الصور الزخرفية البحتة معلَّمة بـ alt فارغ (تظهر كـ decorative)؟", "صورة زخرفية تُقرأ على قارئ الشاشة"],
      ["هل تصف الصور الوظيفية (داخل روابط/أزرار) الإجراء لا الشكل؟", "النص البديل لصورة وظيفية يصف الشكل لا الإجراء"],
    ],
  },
  zoom: {
    title: "التكبير 200% وإعادة التدفق",
    why: "ضعاف البصر يكبّرون الصفحة. يجب أن يبقى المحتوى صالحاً للاستخدام دون تمرير أفقي أو تداخل.",
    questions: [
      ["عند تكبير 200% (⌘+ / Ctrl+)، هل بقي كل النص والوظائف متاحاً — دون اقتصاص أو تداخل؟", "المحتوى يتعطل عند تكبير 200%"],
      ["عند ~400% في نافذة عادية (يعادل عرض 320 بكسل)، هل يعاد تدفق المحتوى في عمود واحد دون تمرير أفقي؟", "لا إعادة تدفق عند عرض يعادل 320 بكسل"],
    ],
  },
  "screen-reader": {
    title: "اختبار قارئ الشاشة",
    why: "الاختبار الحاسم: هل تكون الصفحة مفهومة عند سماعها بدل رؤيتها؟ (ماك: ⌘F5 لتشغيل VoiceOver. ويندوز: NVDA أو Narrator.)",
    questions: [
      ["بالقراءة من الأعلى، هل كان كل ما يُنطق مفهوماً وبترتيب سليم؟", "المحتوى المنطوق مربك أو خارج الترتيب"],
      ["هل أعلنت كل عناصر التحكم دورها واسمها وحالتها بشكل صحيح («زر»، «خانة اختيار، محددة»)؟", "عناصر تعلن دوراً/اسماً/حالة خاطئة أو ناقصة"],
      ["هل أُعلنت التحديثات الديناميكية (تنبيهات، أخطاء تحقق، محتوى مباشر)؟", "تحديث ديناميكي صامت على قارئات الشاشة"],
    ],
  },
  motion: {
    title: "الحركة والرسوم والوميض",
    why: "الحركة التلقائية تشتت؛ والوميض فوق 3 هرتز قد يسبب نوبات صرع.",
    questions: [
      ["هل كل حركة تلقائية تتجاوز 5 ثوانٍ لها زر إيقاف/إيقاف مؤقت؟", "حركة تلقائية دون زر إيقاف"],
      ["هل لا يومض أي محتوى أكثر من 3 مرات في الثانية؟", "محتوى يومض فوق 3 هرتز"],
      ["هل تُحترم تفضيلات «تقليل الحركة» في نظام التشغيل (prefers-reduced-motion)؟", "تجاهل تفضيل تقليل الحركة"],
    ],
  },
  forms: {
    title: "تسميات النماذج ومعالجة الأخطاء",
    why: "الفحص الآلي يتأكد من وجود التسميات؛ الإنسان وحده يحكم إن كانت الأخطاء مفهومة وقابلة للتصحيح.",
    questions: [
      ["عند إرسال بيانات خاطئة، هل توصف الأخطاء نصاً (لا لوناً فقط) موضحةً ما الخطأ وكيف يُصحح؟", "أخطاء غير واضحة أو تُنقل باللون فقط"],
      ["هل ينتقل التركيز إلى أول حقل خاطئ (أو يُعلن عنه)؟", "الأخطاء لا تُلفت انتباه المستخدم"],
      ["هل تُحدد الحقول الإلزامية قبل الإرسال لا بعد الفشل فقط؟", "الحقول الإلزامية غير محددة مسبقاً"],
    ],
  },
};

const HELP_AR = {
  "Scan this page": {
    title: "فحص هذه الصفحة",
    what: "يحقن محرك axe-core (المحرك مفتوح المصدر خلف axe DevTools وLighthouse) في الصفحة ويجري تدقيق WCAG آلياً.",
    benefit: "خلال ثوانٍ تحصل على كل مخالفة قابلة للاكتشاف آلياً، مرتبةً حسب الخطورة، مع الكود المخالف والشرح ورابط الإصلاح.",
    example: "ورثت صفحة قديمة. فحص واحد يخبرك أن فيها 3 مشاكل حرجة (تسميات نماذج مفقودة، صور بلا نص بديل) فتعرف من أين تبدأ بالضبط.",
  },
  "Rule set picker & best practices": {
    title: "اختيار مجموعة القواعد وأفضل الممارسات",
    what: "القائمة تحصر الفحص في مستوى مطابقة WCAG (من 2.0 A حتى 2.2 AA) أو تشغّل كل القواعد. الخيار الإضافي يضيف قواعد axe الاسترشادية غير الملزمة في WCAG. اختيارك يُحفظ كافتراضي.",
    benefit: "طابق الفحص مع متطلبك القانوني أو التعاقدي الفعلي — دون ضجيج من قواعد لست مساءلاً عنها.",
    example: "جهة حكومية تشترط WCAG 2.1 AA. اختر «2.1 AA» وافحص، فيطابق التقرير ما سيدققه المراجع واحداً لواحد.",
  },
  "Record flow (user flow analysis)": {
    title: "تسجيل مسار الاستخدام (تحليل الرحلة)",
    what: "أثناء التسجيل يعاد فحص الصفحة دورياً وبعد كل انتقال، وتُدمج النتائج في تقرير واحد بلا تكرار، مع وسم كل نتيجة بالصفحة التي جاءت منها مثل [/cart].",
    benefit: "الفحص الواحد لا يرى إلا الصفحة كما تبدو الآن. المسارات تلتقط ما يختبئ في الحالات المؤقتة: القوائم المفتوحة، النوافذ المنبثقة، رسائل أخطاء النماذج، وصفحات لاحقة في الرحلة.",
    example: "تدقيق صفحة دفع: اضغط ⏺ في صفحة المنتج → افتح قائمة المقاسات وأضف للسلة → السلة → الدفع → أرسل النموذج فارغاً → اضغط ■. تقرير واحد يغطي الحالات الخمس.",
  },
  "Highlighting & Inspect": {
    title: "التظليل والفحص في Elements",
    what: "انقر أي مقتطف HTML في نتيجة لتحديد العنصر في الصفحة. «تظليل الكل» يحدد كل العناصر المخالفة دفعة واحدة بألوان حسب الخطورة. «Inspect» ينتقل للعنصر في لوحة Elements.",
    benefit: "يحوّل سطراً مجرداً في تقرير إلى شيء تراه وتصلحه.",
    example: "نتيجة تقول «الروابط تحتاج نصاً مميِّزاً» — النقر يكشف أن السبب رابط أيقونة خفي في التذييل ما كنت لتجده بقراءة التقرير.",
  },
  "Contrast checker": {
    title: "فاحص التباين",
    what: "قطّارة تلتقط أي بكسل على شاشتك — اختر لون النص ولون الخلفية لتحصل على نسبة تباين WCAG مع شارات نجاح/فشل لمستويي AA وAAA.",
    benefit: "الفحص الآلي لا يقيس النص فوق الصور أو التدرجات. القطّارة تعمل في أي مكان — حتى على تصميم Figma في نافذة أخرى.",
    example: "مصمم يقترح رمادياً #999 على أبيض. نقرتان تظهران 2.85:1 — يفشل في AA (المطلوب 4.5:1). اكتُشف قبل الإطلاق.",
  },
  "Export (JSON / CSV / HTML)": {
    title: "التصدير (JSON / CSV / HTML / PDF)",
    what: "ينزّل آخر فحص — مع أحكام الاختبارات اليدوية ونتائجها ومقترحات الإصلاح لكل عنصر — بصيغة JSON خام أو CSV جدولي أو تقرير HTML مستقل أو PDF عبر نافذة الطباعة.",
    benefit: "تصبح النتائج ملفات قابلة للمشاركة: أرفق التقرير بتذكرة، أو استورد CSV في جدول، أو قارن JSON في CI.",
    example: "يسأل مدير المنتج «ما مدى سوء الوضع؟». ترسل تقرير HTML — الإجماليات أعلاه وكل مخالفة مشروحة مع إصلاحها المقترح — دون حاجته للإضافة.",
  },
  "Scan history & NEW badges": {
    title: "سجل الفحوصات وشارات NEW",
    what: "يُحفظ آخر فحص لكل رابط محلياً. الفحص التالي يعرض «س جديدة · ص أُصلحت» مقارنةً بالسابق مع مخطط اتجاه عبر الزمن، والنتائج غير المرصودة سابقاً تحمل شارة NEW.",
    benefit: "يجيب عن السؤالين المهمين أثناء الإصلاح: هل أصلح تعديلي المشكلة فعلاً؟ وهل كسرت شيئاً آخر؟",
    example: "أصلحت 5 مشاكل نص بديل وأعدت الفحص: «0 جديدة · 5 أُصلحت». بعد أسبوع يُظهر مكوّن زميلك «3 جديدة» — انحدار اكتُشف يوم حدوثه.",
  },
  "Stale results banner": {
    title: "تنبيه النتائج القديمة",
    what: "بعد الفحص يراقب مراقبٌ الصفحة. إذا تغيّر DOM أو انتقلت الصفحة، يظهر تنبيه بأن النتائج قد تكون قديمة.",
    benefit: "يمنع الخطأ الكلاسيكي: تصحيح مشكلة بالاستناد إلى تقرير قديم بعد أن أعادت الصفحة الرسم.",
    example: "تفحص ثم تسجّل الدخول في الصفحة. يظهر التنبيه مذكّراً أن واجهة ما بعد الدخول تحتاج فحصها الخاص.",
  },
  "Guided manual tests (wizards)": {
    title: "الاختبارات اليدوية الموجّهة (المعالج التفاعلي)",
    what: "عشرة اختبارات موجّهة لما لا تستطيع الآلة الحكم عليه. كلٌّ يعمل كمعالج: سؤال نعم/لا واحد في كل خطوة، والحكم يُحسب من إجاباتك. كل «لا» تُسجَّل كنتيجة محددة — مع ملاحظة اختيارية وعنصر تختاره من الصفحة مباشرة.",
    benefit: "الأدوات الآلية تلتقط 30–50% من WCAG فقط. المعالجات تنظّم الباقي بحيث يجري غيرُ الخبير تدقيقاً موثوقاً، وتظهر النتائج في التصدير بجانب النتائج الآلية.",
    example: "في معالج لوحة المفاتيح تجيب «لا» على «هل خرجت بـ Tab من كل مكوّن؟»، تنقر 📌 ثم تنقر النافذة المنبثقة العالقة — فيتضمن التقرير «فخ لوحة مفاتيح» مع محدد ذلك العنصر.",
  },
  "Fix suggestions, Preview fix & AI fix": {
    title: "مقترحات الإصلاح والمعاينة الحية وإصلاح الذكاء الاصطناعي",
    what: "تعرض النتائج مقتطفاً مصححاً جاهزاً للصق مبنياً من HTML الفعلي للعنصر (HTML أو React أو Vue — من الإعدادات). فشل التباين يحصل على أقرب لون ناجح محسوب. «معاينة الإصلاح» تطبّق التغيير حياً في الصفحة (مع تراجع)، و«⚡ إصلاح تلقائي» يطبّق كل الإصلاحات الآلية دفعة واحدة. «🤖 إصلاح AI» الاختياري يرسل المقتطف المخالف وحده إلى Claude API بمفتاحك الخاص.",
    benefit: "معظم الفاحصات تتوقف عند «هذا ما انكسر» — هنا تكتمل الحلقة إلى «هذا هو الإصلاح، شاهده يعمل، ثم الصقه».",
    example: "نتيجة تباين تقول إن #9e9e9e يفشل على الأبيض. المقترح يعرض color: #757575 (نجاح 4.61:1 بنفس الدرجة اللونية). المعاينة تلوّن الصفحة الحية، وإعادة الفحص تنجح، فتنسخ سطر CSS الواحد إلى ملفك.",
  },
  "Keyboard shortcuts & options": {
    title: "اختصارات لوحة المفاتيح والإعدادات",
    what: "في اللوحة: S فحص، R تسجيل/إيقاف المسار، X مسح التظليل، C التباين، 1/2/3 تبديل التبويبات. صفحة الإعدادات (زر الفأرة الأيمن على أيقونة الإضافة ← Options) تضبط مستوى WCAG الافتراضي وإطار عمل المقتطفات وفاصل فحص المسار واللغة.",
    benefit: "استخدام يومي أسرع، وافتراضيات تناسب طريقة عمل فريقك.",
    example: "اختر العربية في الإعدادات فتنقلب اللوحة إلى RTL بمحتوى مترجم بالكامل.",
  },
  "WCAG 3.0 readiness": {
    title: "الجاهزية لـ WCAG 3.0",
    what: "لا يزال WCAG 3.0 («سيلفر») مسودة لدى W3C — لا أداة تستطيع الفحص وفقه شرعياً بعد، وليس في axe-core قواعد WCAG 3 لأن معايير النجاح لم تُعتمد. تتبع A11y Lens المعايير المستقرة (WCAG 2.0/2.1/2.2 وهي الأساس القانوني عالمياً) وستضيف WCAG 3 عند اعتماده ودعمه في axe-core.",
    benefit: "لن تُفاجأ: كل ما تبلغ عنه الأداة يطابق المعايير التي يعتمدها المدققون والأنظمة اليوم، ومطابقة WCAG 2.2 AA هي الممر المتوقع نحو WCAG 3 — لا شيء تصلحه الآن يضيع.",
    example: "يسأل عميل «هل نحن جاهزون لـ WCAG 3؟». الإجابة الأمينة التي تدعمها الأداة: «WCAG 3 مسودة؛ نطابق WCAG 2.2 AA وهو المطلوب حالياً والأساس الذي يبني عليه WCAG 3».",
  },
  "UAE Design System (DLS) check": {
    title: "فحص نظام التصميم الإماراتي (DLS)",
    what: "نقرة واحدة تدقق الصفحة وفق نظام التصميم الإماراتي (AEGov DLS v3 على designsystem.gov.ae — الإلزامي للجهات الاتحادية): اعتماد مكوّنات aegov-، مجموعة الخطوط (Roboto/Inter للإنجليزية وNoto Kufi Arabic/Alexandria للعربية)، حد الأوزان الخمسة، مطابقة الألوان لرموز حزمة @aegov/design-system الفعلية (115 رمزاً)، متطلبات ثنائية اللغة وRTL، وسم العرض المتجاوب، ومستوى WCAG 2.2 AA الإلزامي عبر الفاحص.",
    benefit: "تحصل فرق الجهات الاتحادية على إجابة فورية: هل الصفحة على نظام التصميم؟ وأين تنحرف؟ — بما فيها الألوان غير الرمزية المستخدمة وأقرب رمز رسمي لكل منها.",
    example: "موقع فرعي لوزارة يسجل 3/8: الخطوط Open Sans بدل Roboto/Inter، والأزرار بلون #1a73e8 (أقرب رمز: techblue-600)، ولا يوجد مبدّل للعربية. التقرير هو قائمة التصحيح للمورّد.",
  },
  "What automation can't do": {
    title: "ما لا تستطيعه الأتمتة",
    what: "قواعد axe-core متحفظة عمداً: لا تبلغ إلا عما يمكن إثبات خطئه، فالإنذارات الكاذبة شبه معدومة.",
    benefit: "يمكنك الوثوق بكل نتيجة آلية — لكن الفحص الآلي النظيف ليس دليلاً على إتاحة الصفحة؛ نحو نصف WCAG يحتاج حكماً بشرياً.",
    example: "alt=\"image123.jpg\" يجتاز الفحص الآلي (السمة موجودة) لكنه يفشل مع مستخدم حقيقي. لهذا وُجد تبويب الاختبارات اليدوية — شغّل الاثنين قبل وصف صفحة بأنها متاحة.",
  },
};

function localizeTest(test) {
  if (lang !== "ar") return test;
  const ar = MANUAL_AR[test.id];
  if (!ar) return test;
  return {
    ...test,
    title: ar.title || test.title,
    why: ar.why || test.why,
    helper: test.helper ? { ...test.helper, label: ar.helperLabel || test.helper.label } : undefined,
    questions: test.questions.map((q, i) =>
      ar.questions && ar.questions[i]
        ? { q: ar.questions[i][0], finding: ar.questions[i][1] }
        : q
    ),
  };
}

function localizeTopic(topic) {
  if (lang !== "ar") return topic;
  const ar = HELP_AR[topic.title];
  if (!ar) return topic;
  return { ...topic, title: ar.title, what: ar.what, benefit: ar.benefit, example: ar.example };
}

/* ---------------- UAE Design System (DLS) check ---------------- */

const DLS_STR = {
  en: {
    title: "🇦🇪 UAE Design System check (heuristic — based on @aegov/design-system v3 conventions)",
    running: "Running DLS check…",
    adoption: "DLS adoption", typography: "Typography", weights: "Font weights",
    colors: "Color tokens", bilingual: "Language & RTL", viewport: "Viewport meta",
    components: "DLS components", wcag: "WCAG 2.2 AA",
    notAdopted: "No aegov- classes found — this page does not appear to use the UAE Design System.",
    adopted: (n, d) => `${n} aegov- class usages (${d} distinct), e.g. `,
    fontsOk: "Body and headings use the DLS font set.",
    fontsBad: (exp) => `Expected ${exp} — found: `,
    weightsOk: (n) => `${n} distinct weights (DLS limit: 5).`,
    weightsBad: (n) => `${n} distinct font weights in use — DLS limits to 5.`,
    colorsOk: (p) => `${p}% of sampled colors match DLS tokens.`,
    colorsBad: (p) => `Only ${p}% of sampled colors match DLS tokens. Top non-token colors: `,
    langMissing: "html has no lang attribute — required for FGE sites (bilingual EN/AR).",
    rtlBad: "Page language is Arabic but dir is not rtl.",
    noSwitcher: "No language switcher detected (EN ⇄ AR is expected on FGE sites).",
    bilingualOk: (l) => `lang="${l}", direction correct` ,
    switcherFound: ", language switcher present.",
    viewportOk: "Responsive viewport meta present.",
    viewportBad: "Missing <meta name=\"viewport\"> — DLS layouts are responsive-first.",
    componentsInfo: (w, t) => `${w}/${t} form controls are inside DLS components.`,
    wcagHint: "DLS mandates WCAG 2.2 AA — run ▶ Scan with the WCAG 2.2 AA rule set for this part.",
    wcagDone: (n) => `Last scan (WCAG 2.2 AA): ${n} violating element(s).`,
    score: (p, t) => `Result: ${p}/${t} checks passed`,
    catalog: "Component catalog", buttons: "Button sizing",
    bodyText: "Body text", headingScale: "Heading scale", displayH1: "Display heading",
    bodyOk: (n) => `${n} text blocks sampled — all ≥16px with line-height ≥1.5.`,
    bodyBad: (s, t) => (s.length ? `${s.length} block(s) below the 16px minimum. ` : "") + (t.length ? `${t.length} block(s) with line-height below 1.5.` : ""),
    scaleOk: "All headings sit on the DLS type scale (76/62/48/40/32/26/20px).",
    scaleBad: (n) => `${n} heading(s) off the DLS type scale (76/62/48/40/32/26/20px).`,
    displayBad: (n) => `${n} display-size heading(s) not using the mandatory extra-light (200) weight.`,
    catalogFound: (found, known) => `${found.length} of ${known} DLS components in use: ${found.map((c) => c.replace("aegov-", "")).join(", ")}`,
    catalogNone: "No DLS components detected.",
    btnOk: (n) => `All ${n} aegov-btn elements match the DLS height spec (32/40/48/52px).`,
    btnBad: (n, off) => `${off.length} of ${n} buttons are off-spec (expected 32/40/48/52px): ` + off.map((o) => o.height + "px").join(", "),
    exportHtml: "⬇ HTML", exportPdf: "⬇ PDF",
    highlightGaps: "◉ Highlight gaps",
    affected: "Affected elements:",
    fixLabel: "Suggested fix:",
    screenshotNote: "Viewport screenshot with DLS gaps outlined (gold dashed):",
    scanShotNote: "Viewport screenshot with violations outlined (color-coded by severity):",
    gapsShown: (n) => `${n} DLS gap(s) outlined on the page (gold dashed) — ✕ Clear highlights removes them.`,
    reportTitle: "UAE Design System conformance report",
  },
  ar: {
    title: "🇦🇪 فحص نظام التصميم الإماراتي (استدلالي — وفق اصطلاحات @aegov/design-system v3)",
    running: "جارٍ فحص نظام التصميم…",
    adoption: "اعتماد النظام", typography: "الخطوط", weights: "أوزان الخط",
    colors: "ألوان الرموز", bilingual: "اللغة والاتجاه", viewport: "وسم العرض",
    components: "مكوّنات النظام", wcag: "WCAG 2.2 AA",
    notAdopted: "لم يُعثر على أصناف aegov- — لا يبدو أن الصفحة تستخدم نظام التصميم الإماراتي.",
    adopted: (n, d) => `${n} استخداماً لأصناف aegov- (${d} صنفاً مميزاً)، مثل `,
    fontsOk: "النص والعناوين يستخدمان خطوط النظام.",
    fontsBad: (exp) => `المتوقع ${exp} — وُجد: `,
    weightsOk: (n) => `${n} أوزان مميزة (حد النظام: 5).`,
    weightsBad: (n) => `${n} وزن خط مستخدم — يحدّ النظام بخمسة.`,
    colorsOk: (p) => `${p}% من الألوان المفحوصة تطابق رموز النظام.`,
    colorsBad: (p) => `فقط ${p}% من الألوان تطابق رموز النظام. أبرز الألوان غير الرمزية: `,
    langMissing: "لا توجد سمة lang على html — مطلوبة لمواقع الجهات الاتحادية (ثنائية اللغة).",
    rtlBad: "لغة الصفحة عربية لكن الاتجاه ليس rtl.",
    noSwitcher: "لم يُرصد مبدّل لغة (يُتوقع EN ⇄ AR في مواقع الجهات الاتحادية).",
    bilingualOk: (l) => `lang="${l}" والاتجاه صحيح`,
    switcherFound: "، ومبدّل اللغة موجود.",
    viewportOk: "وسم العرض المتجاوب موجود.",
    viewportBad: "وسم <meta name=\"viewport\"> مفقود — تخطيطات النظام متجاوبة أولاً.",
    componentsInfo: (w, t) => `${w}/${t} من عناصر النماذج داخل مكوّنات النظام.`,
    wcagHint: "يلزم النظام بمطابقة WCAG 2.2 AA — شغّل ▶ الفحص بمجموعة قواعد WCAG 2.2 AA لهذا الجزء.",
    wcagDone: (n) => `آخر فحص (WCAG 2.2 AA): ${n} عنصراً مخالفاً.`,
    score: (p, t) => `النتيجة: نجاح ${p} من ${t} فحوصات`,
    catalog: "كتالوج المكوّنات", buttons: "مقاسات الأزرار",
    bodyText: "نص المحتوى", headingScale: "مقياس العناوين", displayH1: "عنوان العرض",
    bodyOk: (n) => `تم فحص ${n} فقرة — كلها ≥16 بكسل وتباعد أسطر ≥1.5.`,
    bodyBad: (s, t) => (s.length ? `${s.length} فقرة دون الحد الأدنى 16 بكسل. ` : "") + (t.length ? `${t.length} فقرة بتباعد أسطر أقل من 1.5.` : ""),
    scaleOk: "جميع العناوين على مقياس النظام (76/62/48/40/32/26/20 بكسل).",
    scaleBad: (n) => `${n} عنواناً خارج مقياس النظام (76/62/48/40/32/26/20 بكسل).`,
    displayBad: (n) => `${n} عنوان عرض لا يستخدم الوزن الإلزامي فائق الخفة (200).`,
    catalogFound: (found, known) => `${found.length} من ${known} مكوّناً مستخدماً: ${found.map((c) => c.replace("aegov-", "")).join("، ")}`,
    catalogNone: "لم تُرصد مكوّنات النظام.",
    btnOk: (n) => `جميع أزرار aegov-btn (${n}) تطابق مواصفة الارتفاع (32/40/48/52 بكسل).`,
    btnBad: (n, off) => `${off.length} من ${n} زراً خارج المواصفة (المتوقع 32/40/48/52 بكسل): ` + off.map((o) => o.height + "px").join("، "),
    exportHtml: "⬇ HTML", exportPdf: "⬇ PDF",
    highlightGaps: "◉ تظليل الفجوات",
    affected: "العناصر المتأثرة:",
    fixLabel: "الإصلاح المقترح:",
    screenshotNote: "لقطة شاشة لمنطقة العرض مع تحديد الفجوات (إطار ذهبي متقطع):",
    scanShotNote: "لقطة شاشة لمنطقة العرض مع تحديد المخالفات (ملونة حسب الخطورة):",
    gapsShown: (n) => `تم تحديد ${n} فجوة على الصفحة (إطار ذهبي متقطع) — «✕ مسح التظليل» يزيلها.`,
    reportTitle: "تقرير مطابقة نظام التصميم الإماراتي",
  },
};
const dt = (key, ...args) => {
  const v = (DLS_STR[lang] || DLS_STR.en)[key] ?? DLS_STR.en[key];
  return typeof v === "function" ? v(...args) : v;
};

const dlsBtn = document.getElementById("dlsBtn");
const dlsReportEl = document.getElementById("dlsReport");
dlsBtn.addEventListener("click", runDlsCheck);

async function runDlsCheck() {
  statusBusy(dt("running"));
  dlsBtn.disabled = true;
  try {
    const r = await bg("dlsCheck");
    renderDlsReport(r);
    statusEl.textContent = "";
  } catch (err) {
    statusEl.textContent = "DLS check failed: " + (err?.message || err);
  } finally {
    dlsBtn.disabled = false;
  }
}

function dlsRow(verdict, label, detailNodes, elements, fix, doc) {
  const row = document.createElement("div");
  row.className = "dls-row";
  const v = document.createElement("span");
  v.className = "dls-verdict " + verdict;
  v.textContent = verdict === "pass" ? "✓ PASS" : verdict === "warn" ? "△ WARN" : "✗ FAIL";
  const l = document.createElement("span");
  l.className = "dls-label";
  l.textContent = label;
  if (doc) {
    const a = document.createElement("a");
    a.href = doc;
    a.target = "_blank";
    a.textContent = " ↗";
    a.title = doc;
    a.style.textDecoration = "none";
    l.appendChild(a);
  }
  const d = document.createElement("span");
  d.className = "dls-detail";
  for (const n of detailNodes) d.append(n);
  if (elements && elements.length) {
    const list = document.createElement("div");
    list.className = "dls-els";
    const cap = document.createElement("div");
    cap.textContent = dt("affected");
    cap.style.fontWeight = "600";
    list.appendChild(cap);
    for (const e of elements) {
      const item = document.createElement("div");
      const code = document.createElement("code");
      code.textContent = e.sel;
      code.title = "Click to highlight on the page";
      code.style.cursor = "pointer";
      code.addEventListener("click", () => highlight([e.sel]));
      item.append(code, " — " + e.info);
      list.appendChild(item);
    }
    d.appendChild(list);
  }
  if (fix) {
    const fx = document.createElement("div");
    fx.className = "dls-fix";
    const cap = document.createElement("span");
    cap.textContent = dt("fixLabel");
    cap.style.fontWeight = "600";
    const code = document.createElement("code");
    code.textContent = fix;
    fx.append(cap, code);
    d.appendChild(fx);
  }
  row.append(v, l, d);
  return row;
}

function swatch(hex) {
  const s = document.createElement("span");
  s.className = "dls-swatch";
  s.style.background = hex;
  return s;
}

const DLS_DOCS = {
  adoption: "https://designsystem.gov.ae/docs/installation",
  typography: "https://designsystem.gov.ae/guidelines/typography",
  weights: "https://designsystem.gov.ae/guidelines/typography",
  colors: "https://designsystem.gov.ae/insights/how-to-use-design-tokens-with-the-uae-design-system",
  bilingual: "https://designsystem.gov.ae/guidelines",
  viewport: "https://designsystem.gov.ae/guidelines",
  components: "https://designsystem.gov.ae/docs/components",
  catalog: "https://designsystem.gov.ae/docs/components",
  buttons: "https://designsystem.gov.ae/docs/components/button",
  bodyText: "https://designsystem.gov.ae/guidelines/typography",
  headingScale: "https://designsystem.gov.ae/guidelines/typography",
  displayH1: "https://designsystem.gov.ae/guidelines/typography",
  wcag: "https://www.w3.org/WAI/WCAG22/quickref/",
};

function dlsDocFor(label) {
  for (const key of Object.keys(DLS_DOCS)) {
    if (dt(key) === label) return DLS_DOCS[key];
  }
  return null;
}

function renderDlsReport(r) {
  dlsReportEl.hidden = false;
  dlsReportEl.textContent = "";
  const h = document.createElement("h2");
  h.textContent = dt("title");
  dlsReportEl.appendChild(h);

  const rows = [];

  // 1. adoption
  if (r.aegovCount > 0) {
    const code = document.createElement("code");
    code.textContent = r.aegovClasses.slice(0, 4).map(([c]) => c).join(", ");
    rows.push(["pass", dt("adoption"), [dt("adopted", r.aegovCount, r.aegovClasses.length), code]]);
  } else {
    rows.push(["fail", dt("adoption"), [dt("notAdopted")], null,
      'npm i @aegov/design-system\n\n/* app.css */\n@import "tailwindcss";\n@plugin "@aegov/design-system";']);
  }

  // 2. typography
  const expStr = `${r.expectedFonts.body[0]} / ${r.expectedFonts.heading[0]}`;
  if (r.bodyFontOk && r.headingFontOk) {
    rows.push(["pass", dt("typography"), [dt("fontsOk")]]);
  } else {
    const code = document.createElement("code");
    code.textContent = [r.bodyFont.split(",")[0], ...r.headingFonts].slice(0, 3).join(", ");
    const fontFix = r.expectedFonts.body[0] === "roboto"
      ? 'body { font-family: "Roboto", sans-serif; }\nh1, h2, h3, h4 { font-family: "Inter", sans-serif; }'
      : 'body { font-family: "Noto Kufi Arabic", sans-serif; }\nh1, h2, h3, h4 { font-family: "Alexandria", sans-serif; }';
    rows.push(["fail", dt("typography"), [dt("fontsBad", expStr), code],
      (r.fontOffenders || []).map((o) => ({ sel: o.sel, info: `<${o.tag}> "${o.text}" — ${o.font}` })),
      fontFix + "\n/* Fonts are on Google Fonts — or use the DLS utilities font-body / font-heading */"]);
  }

  // 3. weights
  const wN = r.fontWeights.length;
  rows.push([wN <= 5 ? "pass" : "warn", dt("weights"),
    [wN <= 5 ? dt("weightsOk", wN) : dt("weightsBad", wN)], null,
    wN <= 5 ? null : "/* Consolidate to the 5 DLS weights, e.g. 300 / 400 / 500 / 700 / 800.\n   Found: " + r.fontWeights.join(", ") + " */"]);

  // 3b. guideline typography: body min size + line-height
  if (r.bodySampled > 0) {
    const s = r.smallBody || [], tl = r.tightLines || [];
    if (!s.length && !tl.length) {
      rows.push(["pass", dt("bodyText"), [dt("bodyOk", r.bodySampled)]]);
    } else {
      rows.push(["warn", dt("bodyText"), [dt("bodyBad", s, tl)],
        [...s.map((o) => ({ sel: o.sel, info: o.px + "px" })),
         ...tl.map((o) => ({ sel: o.sel, info: "line-height " + o.ratio }))],
        "font-size: 1rem; /* ≥16px */\nline-height: 1.5;"]);
    }
  }

  // 3c. heading scale + display weight (desktop viewports only)
  if (r.headingOffScale && r.headingOffScale.length) {
    rows.push(["warn", dt("headingScale"), [dt("scaleBad", r.headingOffScale.length)],
      r.headingOffScale.map((o) => ({ sel: o.sel, info: `<${o.tag}> ${o.px}px` })),
      "/* Use the DLS type scale classes */\n<h2 class=\"text-h2\">…  /* 76/62/48/40/32/26/20px */"]);
  } else if (r.headingOffScale) {
    rows.push(["pass", dt("headingScale"), [dt("scaleOk")]]);
  }
  if (r.displayWeightBad && r.displayWeightBad.length) {
    rows.push(["fail", dt("displayH1"), [dt("displayBad", r.displayWeightBad.length)],
      r.displayWeightBad.map((o) => ({ sel: o.sel, info: `${o.px}px, weight ${o.weight}` })),
      "font-weight: 200; /* Display size must be extra light, and only in banners covering ≥60% of the viewport */"]);
  }

  // 4. colors
  if (r.colorsSampled > 0) {
    const pct = Math.round((r.colorsInPalette / r.colorsSampled) * 100);
    if (pct >= 70) {
      rows.push(["pass", dt("colors"), [dt("colorsOk", pct)]]);
    } else {
      const detail = [dt("colorsBad", pct)];
      for (const o of r.offenders.slice(0, 4)) {
        detail.push(swatch(o.hex));
        const code = document.createElement("code");
        code.textContent = `${o.hex} (→ ${o.nearestToken})`;
        detail.push(code, " ");
      }
      rows.push([pct >= 40 ? "warn" : "fail", dt("colors"), detail,
        r.offenders.flatMap((o) => (o.sels || []).slice(0, 2).map((sel) => ({ sel, info: `${o.hex} → ${o.nearestToken}` }))),
        r.offenders.slice(0, 3).map((o) =>
          `color: var(--color-${o.nearestToken}); /* was ${o.hex} — token ${o.nearestHex} */`).join("\n")]);
    }
  }

  // 5. bilingual / RTL
  const switcherFix = '<a href="/ar" hreflang="ar" lang="ar">العربية</a> / <a href="/en" hreflang="en">English</a>';
  if (!r.lang) {
    rows.push(["fail", dt("bilingual"), [dt("langMissing")], null,
      '<html lang="en">  <!-- or: -->  <html lang="ar" dir="rtl">']);
  } else if (r.lang.toLowerCase().startsWith("ar") && r.dir !== "rtl") {
    rows.push(["fail", dt("bilingual"), [dt("rtlBad")], null, '<html lang="ar" dir="rtl">']);
  } else if (!r.langSwitcher) {
    rows.push(["warn", dt("bilingual"), [dt("bilingualOk", r.lang) + ". " + dt("noSwitcher")], null, switcherFix]);
  } else {
    rows.push(["pass", dt("bilingual"), [dt("bilingualOk", r.lang) + dt("switcherFound")]]);
  }

  // 6. viewport
  rows.push([r.viewport ? "pass" : "fail", dt("viewport"),
    [r.viewport ? dt("viewportOk") : dt("viewportBad")], null,
    r.viewport ? null : '<meta name="viewport" content="width=device-width, initial-scale=1">']);

  // 7. components (informational when adopted)
  if (r.aegovCount > 0 && r.controls > 0) {
    const ratio = r.controlsWithAegov / r.controls;
    rows.push([ratio >= 0.8 ? "pass" : "warn", dt("components"),
      [dt("componentsInfo", r.controlsWithAegov, r.controls)],
      (r.rawControls || []).map((o) => ({ sel: o.sel, info: o.tag })),
      ratio >= 0.8 ? null : '<button class="aegov-btn">…</button>\n<div class="aegov-form-control"><label for="x">…</label><input id="x"></div>']);
  }

  // 7b. component catalog + button sizing (when adopted)
  if (r.aegovCount > 0) {
    if (r.componentsFound && r.componentsFound.length) {
      rows.push(["pass", dt("catalog"), [dt("catalogFound", r.componentsFound, r.componentsKnown)]]);
    } else {
      rows.push(["warn", dt("catalog"), [dt("catalogNone")]]);
    }
    if (r.buttons > 0) {
      rows.push([r.buttonsOffSpec.length === 0 ? "pass" : "warn", dt("buttons"),
        [r.buttonsOffSpec.length === 0 ? dt("btnOk", r.buttons) : dt("btnBad", r.buttons, r.buttonsOffSpec)],
        r.buttonsOffSpec.map((o) => ({ sel: o.sel, info: `"${o.text}" — ${o.height}px` })),
        r.buttonsOffSpec.length === 0 ? null :
          '/* Remove custom heights; use the size variants */\n<button class="aegov-btn btn-xs|btn-sm|btn-base|btn-lg">…</button>']);
    }
  }

  // 8. WCAG tie-in
  if (lastReport && (settings.level === "wcag22aa" || lastReport.ruleSet.includes("2.2"))) {
    const total = lastReport.violations.reduce((a, v) => a + v.nodeTotal, 0);
    rows.push([total === 0 ? "pass" : "fail", dt("wcag"), [dt("wcagDone", total)]]);
  } else {
    rows.push(["warn", dt("wcag"), [dt("wcagHint")]]);
  }

  let passed = 0;
  for (const [verdict, label, detail, elements, fix] of rows) {
    if (verdict === "pass") passed++;
    dlsReportEl.appendChild(dlsRow(verdict, label, detail, elements, fix, dlsDocFor(label)));
  }
  const score = document.createElement("div");
  score.className = "dls-row";
  score.style.fontWeight = "700";
  score.textContent = dt("score", passed, rows.length);
  dlsReportEl.appendChild(score);

  // keep a plain-text copy for exports
  lastDlsExport = {
    scannedAt: new Date().toISOString(),
    score: { passed, total: rows.length },
    rows: rows.map((rw, i) => {
      const rowEl = dlsReportEl.querySelectorAll(".dls-row")[i];
      const detailEl = rowEl && rowEl.querySelector(".dls-detail");
      let detailText = detailEl ? detailEl.textContent : "";
      const elsEl = detailEl && detailEl.querySelector(".dls-els");
      if (elsEl) detailText = detailText.replace(elsEl.textContent, "");
      return { verdict: rw[0], label: rw[1], detail: detailText, elements: rw[3] || [], fix: rw[4] || null, doc: dlsDocFor(rw[1]) };
    }),
  };

  const actions = document.createElement("div");
  actions.className = "dls-row";
  const htmlBtn = document.createElement("button");
  htmlBtn.textContent = dt("exportHtml");
  htmlBtn.addEventListener("click", () => exportDls("html"));
  const pdfBtn = document.createElement("button");
  pdfBtn.textContent = dt("exportPdf");
  pdfBtn.addEventListener("click", () => exportDls("pdf"));
  const gapsBtn = document.createElement("button");
  gapsBtn.textContent = dt("highlightGaps");
  gapsBtn.addEventListener("click", async () => {
    try {
      const n = await bg("dlsHighlight");
      statusEl.textContent = dt("gapsShown", n);
    } catch (err) {
      statusEl.textContent = "Highlight failed: " + (err?.message || err);
    }
  });
  actions.append(gapsBtn, htmlBtn, pdfBtn);
  dlsReportEl.appendChild(actions);
}

let lastDlsExport = null;

function dlsSectionHtml(dlsShot) {
  if (!lastDlsExport) return "";
  const dlsShotHtml = dlsShot ? `
  <h3 style="margin-top:16px">${escHtml(dt("screenshotNote"))}</h3>
  <img src="${dlsShot}" style="max-width:100%;border:1px solid #ddd;border-radius:6px">` : "";
  const color = { pass: "#2e7d32", warn: "#b68a35", fail: "#d32f2f" };
  const mark = { pass: "✓ PASS", warn: "△ WARN", fail: "✗ FAIL" };
  const rows = lastDlsExport.rows.map((r) => `
    <tr>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;font-weight:700;white-space:nowrap;vertical-align:top;color:${color[r.verdict]}">${mark[r.verdict]}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;font-weight:600;white-space:nowrap;vertical-align:top">${
        r.doc ? `<a href="${escHtml(r.doc)}" style="color:inherit">${escHtml(r.label)} ↗</a>` : escHtml(r.label)}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee">${escHtml(r.detail)}${
        r.elements && r.elements.length ? `<div style="margin-top:4px">${r.elements.map((e) =>
          `<div><code style="background:#f4f0e8;border-radius:3px;padding:0 4px;font-size:12px">${escHtml(e.sel)}</code> <span style="color:#777">${escHtml(e.info)}</span></div>`).join("")}</div>` : ""
      }${r.fix ? `<div style="border-left:4px solid #2e7d32;background:#f2f8f2;border-radius:4px;padding:5px 8px;margin-top:5px">
          <div style="color:#2e7d32;font-weight:700;font-size:11px">${escHtml(dt("fixLabel"))}</div>
          <code style="display:block;white-space:pre-wrap;word-break:break-all;font-size:12px">${escHtml(r.fix)}</code></div>` : ""}</td>
    </tr>`).join("");
  return `
  <h2 style="font-size:18px;margin-top:30px;border-top:4px solid #b68a35;padding-top:12px">🇦🇪 ${escHtml(dt("reportTitle"))}
    <small style="color:#888">— ${lastDlsExport.score.passed}/${lastDlsExport.score.total}</small></h2>
  <table style="border-collapse:collapse;width:100%">${rows}</table>
  ${dlsShotHtml}
  <p style="color:#999;font-size:12px">Heuristic check based on @aegov/design-system v3 conventions (designsystem.gov.ae). Not an official TDRA certification.</p>`;
}

async function exportDls(format) {
  if (!lastDlsExport) return;
  const url = await getPageUrl();
  let shot = null;
  try {
    await bg("dlsHighlight");
    await new Promise((r) => setTimeout(r, 400));
    shot = await bg("captureTab");
  } catch (_) { /* capture unavailable (e.g. Firefox permission) — export without it */ }
  const shotHtml = shot
    ? `<h3 style="margin-top:24px">${escHtml(dt("screenshotNote"))}</h3>
       <img src="${shot}" style="max-width:100%;border:1px solid #ddd;border-radius:6px">`
    : "";
  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><title>${escHtml(dt("reportTitle"))}</title></head>
<body style="font:14px/1.6 system-ui,sans-serif;max-width:900px;margin:30px auto;padding:0 16px;background:#fff;color:#1a1a1a">
  <p><b>${escHtml(url)}</b><br>${escHtml(lastDlsExport.scannedAt)}</p>
  ${dlsSectionHtml()}
  ${shotHtml}
  ${format === "pdf" ? "<script>addEventListener('load',()=>setTimeout(()=>print(),400))<\/script>" : ""}
</body></html>`;
  if (format === "pdf") {
    window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })));
  } else {
    download("a11y-lens-dls-" + safeName(url) + ".html", "text/html", html);
  }
}
