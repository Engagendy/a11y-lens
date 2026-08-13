// A11y Lens background service worker.
// DevTools panel pages cannot use EXT.scripting or EXT.storage directly —
// the panel sends {op, tabId, ...} messages here and this worker does the work.

// Works on Chromium (chrome.*) and Firefox (browser.*, promise-based).
const EXT = globalThis.browser || globalThis.chrome;
// UAE Design System (AEGov DLS) tokens, generated from @aegov/design-system@3.0.7
// (OKLCH tokens converted to sRGB hex). Do not edit by hand.
const DLS_DATA = {"version":"3.0.7","colors":{"#f9f7ed":"aegold-50","#f2eccf":"aegold-100","#e6d7a2":"aegold-200","#d7bc6d":"aegold-300","#cba344":"aegold-400","#b68a35":"aegold-500","#92722a":"aegold-600","#7c5e24":"aegold-700","#6c4527":"aegold-800","#5d3b26":"aegold-900","#361e12":"aegold-950","#fef2f2":"aered-50","#fde4e3":"aered-100","#fdcdcb":"aered-200","#faaaa7":"aered-300","#f47a75":"aered-400","#ea4f49":"aered-500","#d83731":"aered-600","#b52520":"aered-700","#95231f":"aered-800","#7c2320":"aered-900","#430e0c":"aered-950","#f3faf4":"aegreen-50","#e4f4e7":"aegreen-100","#cae8cf":"aegreen-200","#a0d5ab":"aegreen-300","#6fb97f":"aegreen-400","#4a9d5c":"aegreen-500","#3f8e50":"aegreen-600","#2f663c":"aegreen-700","#2a5133":"aegreen-800","#24432b":"aegreen-900","#0f2415":"aegreen-950","#f7f7f7":"aeblack-50","#e1e3e5":"aeblack-100","#c3c6cb":"aeblack-200","#9ea2a9":"aeblack-300","#797e86":"aeblack-400","#5f646d":"aeblack-500","#4b4f58":"aeblack-600","#3e4046":"aeblack-700","#232528":"aeblack-800","#1b1d21":"aeblack-900","#0e0f12":"aeblack-950","#ffffff":"whitely-50","#fcfcfc":"whitely-100","#f2f2f2":"whitely-300","#ededed":"whitely-400","#e8e8e8":"whitely-500","#fffbeb":"camel-50","#fdf4c8":"camel-100","#fbe68c":"camel-200","#fad44f":"camel-300","#f8c027":"camel-400","#f29f10":"camel-500","#d67907":"camel-600","#b2550a":"camel-700","#904111":"camel-800","#773610":"camel-900","#441b04":"camel-950","#f8fafc":"slate-50","#f1f5f9":"slate-100","#e2e8f0":"slate-200","#cbd5e1":"slate-300","#94a3b8":"slate-400","#64748b":"slate-500","#475569":"slate-600","#334155":"slate-700","#1e293b":"slate-800","#0f172a":"slate-900","#020617":"slate-950","#fdf4ff":"fuchsia-50","#fae8ff":"fuchsia-100","#f5d0fe":"fuchsia-200","#f0abfc":"fuchsia-300","#e879f9":"fuchsia-400","#d946ef":"fuchsia-500","#c026d3":"fuchsia-600","#a21caf":"fuchsia-700","#86198f":"fuchsia-800","#701a75":"fuchsia-900","#4a044e":"fuchsia-950","#e7f5ff":"techblue-50","#d3edff":"techblue-100","#b0dbff":"techblue-200","#81c1ff":"techblue-300","#4f98ff":"techblue-400","#296cff":"techblue-500","#043dff":"techblue-600","#003cff":"techblue-700","#002dc2":"techblue-800","#0b32a4":"techblue-900","#071c5f":"techblue-950","#effaff":"seablue-50","#def3ff":"seablue-100","#b6eaff":"seablue-200","#76dbff":"seablue-300","#2bcaff":"seablue-400","#00abeb":"seablue-500","#0190d4":"seablue-600","#0173ab":"seablue-700","#00608d":"seablue-800","#065074":"seablue-900","#04334d":"seablue-950","#fef5ee":"desert-50","#fce9d8":"desert-100","#f9cfaf":"desert-200","#f5ac7c":"desert-300","#ef8048":"desert-400","#eb5f24":"desert-500","#e54b1d":"desert-600","#b73417":"desert-700","#922b1a":"desert-800","#762518":"desert-900","#3f100b":"desert-950"},"fonts":{"en":{"body":["roboto"],"heading":["inter"]},"ar":{"body":["noto kufi arabic","notokufi"],"heading":["alexandria"]}},"components":["aegov-accordion","aegov-alert","aegov-avatar","aegov-backdrop","aegov-badge","aegov-banner","aegov-breadcrumb","aegov-btn","aegov-card","aegov-card-group","aegov-check-group","aegov-check-item","aegov-dropdown","aegov-footer","aegov-form-control","aegov-header","aegov-hero","aegov-hero-static","aegov-link","aegov-modal","aegov-modal-backdrop","aegov-modal-close","aegov-pagination","aegov-popover","aegov-quote","aegov-step","aegov-step-title","aegov-tab","aegov-toast","aegov-toggle","aegov-tooltip"],"button":{"heights":[32,40,48,52],"tolerance":2},"typo":{"headingSizes":[76,62,48,40,32,26,20],"headingWeights":[200,600,700,800],"bodyWeights":[300,400,500,600,700],"minBody":16,"minLineRatio":1.5}};

/* ---------- functions injected into the inspected page ---------- */

function runAxeInPage(runOnlyArg) {
  const options = { resultTypes: ["violations", "passes"] };
  if (runOnlyArg) options.runOnly = runOnlyArg;
  return window.axe.run(document, options).then((r) => ({
    url: location.href,
    frames: document.querySelectorAll("iframe").length,
    passes: r.passes.length,
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact || "minor",
      help: v.help,
      description: v.description,
      helpUrl: v.helpUrl,
      nodes: v.nodes.slice(0, 50).map((n) => ({
        target: n.target.map((t) => (Array.isArray(t) ? t.join(" >>> ") : String(t))),
        html: n.html.slice(0, 300),
        failureSummary: n.failureSummary || "",
      })),
      nodeTotal: v.nodes.length,
    })),
  }));
}

function highlightInPage(sel) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  document.querySelectorAll(".__a11y_lens_highlight").forEach((el) => {
    el.classList.remove("__a11y_lens_highlight");
  });
  if (!document.getElementById("__a11y_lens_style")) {
    const style = document.createElement("style");
    style.id = "__a11y_lens_style";
    style.textContent = `.__a11y_lens_highlight {
      outline: 3px solid #d32f2f !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(211,47,47,.25) !important;
    }`;
    document.documentElement.appendChild(style);
  }
  const el = deepQ(sel);
  if (el) {
    el.classList.add("__a11y_lens_highlight");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function highlightAllInPage(list) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const colors = { critical: "#d32f2f", serious: "#e65100", moderate: "#f9a825", minor: "#616161" };
  document.querySelectorAll("[data-a11y-lens]").forEach((el) => {
    el.removeAttribute("data-a11y-lens");
    el.style.removeProperty("outline");
    el.style.removeProperty("outline-offset");
  });
  const rank = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const best = new Map();
  for (const { sel, impact } of list) {
    if (!best.has(sel) || rank[impact] < rank[best.get(sel)]) best.set(sel, impact);
  }
  for (const [sel, impact] of best) {
    const el = deepQ(sel);
    if (el) {
      el.setAttribute("data-a11y-lens", impact);
      el.style.setProperty("outline", `3px solid ${colors[impact]}`, "important");
      el.style.setProperty("outline-offset", "1px", "important");
    }
  }
}

function clearInPage() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_highlight").forEach((el) => {
    el.classList.remove("__a11y_lens_highlight");
  });
  document.getElementById("__a11y_lens_style")?.remove();
  document.querySelectorAll("[data-a11y-lens]").forEach((el) => {
    el.removeAttribute("data-a11y-lens");
    el.style.removeProperty("outline");
    el.style.removeProperty("outline-offset");
  });
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  if (window.__a11yLensPickHandler) {
    document.removeEventListener("click", window.__a11yLensPickHandler, true);
    document.body.style.cursor = "";
    window.__a11yLensPickHandler = null;
  }
}

function staleInstallInPage() {
  window.__a11yLensDirty = false;
  window.__a11yLensObserver?.disconnect();
  const obs = new MutationObserver(() => {
    if (window.__a11yLensMuted) return;
    window.__a11yLensDirty = true;
    obs.disconnect();
  });
  obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  window.__a11yLensObserver = obs;
}

function staleCheckInPage() {
  return window.__a11yLensDirty === true;
}

function pickStartInPage() {
  window.__a11yLensPicked = null;
  if (window.__a11yLensPickHandler) {
    document.removeEventListener("click", window.__a11yLensPickHandler, true);
  }
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      const idx = parent ? [...parent.children].indexOf(cur) + 1 : 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const h = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener("click", h, true);
    document.body.style.cursor = "";
    window.__a11yLensPickHandler = null;
    window.__a11yLensPicked = cssPath(e.target);
  };
  window.__a11yLensPickHandler = h;
  document.addEventListener("click", h, true);
  document.body.style.cursor = "crosshair";
}

function pickCheckInPage() {
  return window.__a11yLensPicked || null;
}

function applyFixInPage(selector, patch) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const el = deepQ(selector);
  if (!el) return false;
  window.__a11yLensUndo = window.__a11yLensUndo || {};
  if (!window.__a11yLensUndo[selector]) {
    const undo = { attrs: {}, styles: {} };
    for (const name of Object.keys(patch.attrs || {})) {
      undo.attrs[name] = el.hasAttribute(name) ? el.getAttribute(name) : null;
    }
    for (const prop of Object.keys(patch.styles || {})) {
      undo.styles[prop] = el.style.getPropertyValue(prop);
    }
    window.__a11yLensUndo[selector] = undo;
  }
  for (const [name, value] of Object.entries(patch.attrs || {})) {
    el.setAttribute(name, value);
  }
  for (const [prop, value] of Object.entries(patch.styles || {})) {
    el.style.setProperty(prop, value, "important");
  }
  return true;
}

function applyFixAllInPage(items) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 2000);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  window.__a11yLensUndo = window.__a11yLensUndo || {};
  let applied = 0;
  for (const { selector, patch } of items) {
    const el = deepQ(selector);
    if (!el) continue;
    if (!window.__a11yLensUndo[selector]) {
      const undo = { attrs: {}, styles: {} };
      for (const name of Object.keys(patch.attrs || {})) {
        undo.attrs[name] = el.hasAttribute(name) ? el.getAttribute(name) : null;
      }
      for (const prop of Object.keys(patch.styles || {})) {
        undo.styles[prop] = el.style.getPropertyValue(prop);
      }
      window.__a11yLensUndo[selector] = undo;
    }
    for (const [name, value] of Object.entries(patch.attrs || {})) el.setAttribute(name, value);
    for (const [prop, value] of Object.entries(patch.styles || {})) {
      el.style.setProperty(prop, value, "important");
    }
    applied++;
  }
  return applied;
}

function undoAllInPage() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 2000);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const undoMap = window.__a11yLensUndo || {};
  let restored = 0;
  for (const [selector, undo] of Object.entries(undoMap)) {
    const el = deepQ(selector);
    if (!el) continue;
    for (const [name, value] of Object.entries(undo.attrs)) {
      if (value === null) el.removeAttribute(name);
      else el.setAttribute(name, value);
    }
    for (const [prop, value] of Object.entries(undo.styles)) {
      if (value === "") el.style.removeProperty(prop);
      else el.style.setProperty(prop, value, "important");
    }
    restored++;
  }
  window.__a11yLensUndo = {};
  return restored;
}

function undoFixInPage(selector) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const el = deepQ(selector);
  const undo = window.__a11yLensUndo?.[selector];
  if (!el || !undo) return false;
  for (const [name, value] of Object.entries(undo.attrs)) {
    if (value === null) el.removeAttribute(name);
    else el.setAttribute(name, value);
  }
  for (const [prop, value] of Object.entries(undo.styles)) {
    if (value === "") el.style.removeProperty(prop);
    else el.style.setProperty(prop, value, "important");
  }
  delete window.__a11yLensUndo[selector];
  return true;
}

function helperTabStops() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  const els = [...document.querySelectorAll(
    "a[href],button,input,select,textarea,summary,audio[controls],video[controls],[contenteditable=''],[contenteditable='true'],[tabindex]"
  )].filter((el) => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length &&
    getComputedStyle(el).visibility !== "hidden");
  const pos = els.filter((el) => el.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  const ordered = [...pos, ...els.filter((el) => el.tabIndex === 0)];
  ordered.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = i + 1;
    b.style.cssText = `position:absolute;z-index:2147483647;left:${scrollX + r.left - 6}px;top:${scrollY + r.top - 6}px;` +
      "background:#7b1fa2;color:#fff;font:bold 11px/18px sans-serif;min-width:18px;height:18px;" +
      "text-align:center;border-radius:9px;padding:0 3px;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.5)";
    document.body.appendChild(b);
    el.style.setProperty("outline", "2px dashed #7b1fa2", "important");
    el.setAttribute("data-a11y-lens", "tabstop");
  });
  const posWarn = pos.length ? ` ⚠ ${pos.length} element(s) use positive tabindex — usually a smell.` : "";
  return `${ordered.length} tab stops numbered in keyboard order.${posWarn}`;
}

function helperHeadings() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role='heading']")]
    .filter((el) => el.getClientRects().length);
  const lines = [];
  let prev = 0, skips = 0;
  for (const h of hs.slice(0, 80)) {
    const lvl = h.matches("[role='heading']")
      ? parseInt(h.getAttribute("aria-level") || "2", 10)
      : parseInt(h.tagName[1], 10);
    if (prev && lvl > prev + 1) skips++;
    prev = lvl;
    lines.push("  ".repeat(lvl - 1) + "h" + lvl + "  " + (h.textContent.trim().slice(0, 70) || "(empty)"));
    const r = h.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = "h" + lvl;
    b.style.cssText = `position:absolute;z-index:2147483647;left:${scrollX + r.left - 4}px;top:${scrollY + r.top - 16}px;` +
      "background:#1976d2;color:#fff;font:bold 10px/14px sans-serif;padding:0 4px;border-radius:3px;pointer-events:none";
    document.body.appendChild(b);
  }
  const h1s = hs.filter((h) => h.tagName === "H1").length;
  const notes = [];
  if (h1s !== 1) notes.push(`⚠ ${h1s} h1 elements (expected exactly 1)`);
  if (skips) notes.push(`⚠ ${skips} level skip(s)`);
  if (!hs.length) return "No headings found — that itself is a problem on most pages.";
  return (notes.length ? notes.join(" · ") + "\n\n" : "") + lines.join("\n") +
    (hs.length > 80 ? `\n…and ${hs.length - 80} more` : "");
}

function helperLandmarks() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  const sel = "header,nav,main,aside,footer,form,section[aria-label],section[aria-labelledby]," +
    "[role='banner'],[role='navigation'],[role='main'],[role='complementary']," +
    "[role='contentinfo'],[role='search'],[role='form'],[role='region']";
  const found = [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length);
  const names = [];
  for (const el of found) {
    const name = el.getAttribute("role") || el.tagName.toLowerCase();
    const label = el.getAttribute("aria-label") || "";
    names.push(name + (label ? ` ("${label}")` : ""));
    const r = el.getBoundingClientRect();
    el.style.setProperty("outline", "2px solid #00838f", "important");
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = name + (label ? ": " + label : "");
    b.style.cssText = `position:absolute;z-index:2147483647;left:${scrollX + r.left}px;top:${scrollY + r.top}px;` +
      "background:#00838f;color:#fff;font:bold 10px/16px sans-serif;padding:0 5px;pointer-events:none";
    document.body.appendChild(b);
  }
  const mains = found.filter((el) => el.tagName === "MAIN" || el.getAttribute("role") === "main").length;
  const notes = [];
  if (!found.length) return "No landmarks found — page content is not in any region. Likely a fail.";
  if (mains !== 1) notes.push(`⚠ ${mains} main landmark(s) (expected exactly 1)`);
  return (notes.length ? notes.join(" · ") + "\n" : "") + "Found: " + names.join(", ");
}

function helperAltOverlay() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  const imgs = [...document.querySelectorAll("img,svg,[role='img']")]
    .filter((el) => el.getClientRects().length);
  let missing = 0;
  for (const el of imgs) {
    let text, bad = false;
    if (el.tagName === "IMG") {
      if (!el.hasAttribute("alt")) { text = "NO ALT ATTRIBUTE"; bad = true; missing++; }
      else if (el.alt.trim() === "") text = 'alt="" (decorative)';
      else text = "alt: " + el.alt.slice(0, 60);
    } else {
      const label = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") ||
        el.querySelector("title")?.textContent;
      if (label) text = "label: " + String(label).slice(0, 60);
      else if (el.getAttribute("aria-hidden") === "true") text = "aria-hidden (decorative)";
      else { text = "NO ACCESSIBLE NAME"; bad = true; missing++; }
    }
    const r = el.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = text;
    b.style.cssText = `position:absolute;z-index:2147483647;left:${scrollX + r.left}px;top:${scrollY + r.top}px;` +
      `max-width:${Math.max(r.width, 120)}px;background:${bad ? "#d32f2f" : "#2e7d32"};color:#fff;` +
      "font:10px/14px sans-serif;padding:1px 5px;pointer-events:none;word-break:break-word";
    document.body.appendChild(b);
  }
  return `${imgs.length} image(s) labeled — ${missing} with no accessible name. ` +
    "Now judge the QUALITY of each green label against what the image shows.";
}

const HELPERS = {
  tabStops: helperTabStops,
  headings: helperHeadings,
  landmarks: helperLandmarks,
  altOverlay: helperAltOverlay,
};

function dlsCheckInPage(data) {
  const out = {};
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      const idx = parent ? [...parent.children].indexOf(cur) + 1 : 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const lang = (document.documentElement.lang || "").toLowerCase();
  const isAr = lang.startsWith("ar");
  out.lang = document.documentElement.lang || null;
  out.dir = document.documentElement.dir || "ltr";
  out.viewport = !!document.querySelector('meta[name="viewport"]');
  out.langSwitcher = !!(document.querySelector("[hreflang]") ||
    [...document.querySelectorAll("a,button")].slice(0, 400).some((el) =>
      /العربية|عربي|english/i.test(el.textContent.trim())));

  // --- aegov- class adoption ---
  const all = document.querySelectorAll("*");
  const cap = Math.min(all.length, 6000);
  const aegovClasses = new Map();
  let aegovCount = 0;
  for (let i = 0; i < cap; i++) {
    for (const c of all[i].classList) {
      if (c.startsWith("aegov-")) {
        aegovCount++;
        aegovClasses.set(c, (aegovClasses.get(c) || 0) + 1);
      }
    }
  }
  out.elementsScanned = cap;
  out.aegovCount = aegovCount;
  out.aegovClasses = [...aegovClasses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  // --- typography ---
  const expected = data.fonts[isAr ? "ar" : "en"];
  const fam = (el) => getComputedStyle(el).fontFamily.toLowerCase();
  const hasAny = (stack, names) => names.some((n) => stack.includes(n));
  out.bodyFont = getComputedStyle(document.body).fontFamily.slice(0, 120);
  out.bodyFontOk = hasAny(fam(document.body), expected.body);
  const headings = [...document.querySelectorAll("h1,h2,h3")].slice(0, 10);
  out.headingFonts = [...new Set(headings.map((h) => fam(h).split(",")[0].trim()))].slice(0, 5);
  out.headingFontOk = headings.length === 0 || headings.every((h) => hasAny(fam(h), expected.heading));
  out.fontOffenders = headings
    .filter((h) => !hasAny(fam(h), expected.heading))
    .slice(0, 8)
    .map((h) => ({ sel: cssPath(h), tag: h.tagName.toLowerCase(), font: fam(h).split(",")[0].trim().replace(/"/g, ""), text: h.textContent.trim().slice(0, 40) }));
  out.expectedFonts = expected;

  const weights = new Set();
  for (let i = 0; i < cap; i += Math.max(1, Math.floor(cap / 400))) {
    weights.add(getComputedStyle(all[i]).fontWeight);
  }
  out.fontWeights = [...weights].sort();

  // --- color palette conformance ---
  const toHex = (rgb) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgb);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    return "#" + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, "0")).join("");
  };
  const paletteHex = Object.keys(data.colors);
  const parse = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const nearest = (hex) => {
    const [r, g, b] = parse(hex);
    let best = null, bd = Infinity;
    for (const p of paletteHex) {
      const [pr, pg, pb] = parse(p);
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return { token: data.colors[best], hex: best, close: bd <= 900 };
  };
  const sampleEls = document.querySelectorAll(
    "a,button,input,select,h1,h2,h3,header,nav,footer,[class*='btn'],[class*='aegov']");
  const colorUse = new Map();
  const colorSels = new Map();
  for (const el of [...sampleEls].slice(0, 300)) {
    const cs = getComputedStyle(el);
    for (const c of [cs.color, cs.backgroundColor, cs.borderColor]) {
      const hex = toHex(c);
      if (!hex || hex === "#ffffff" || hex === "#000000") continue;
      colorUse.set(hex, (colorUse.get(hex) || 0) + 1);
      if (!colorSels.has(hex)) colorSels.set(hex, []);
      const sels = colorSels.get(hex);
      if (sels.length < 3) sels.push(cssPath(el));
    }
  }
  let inPal = 0, outPal = 0;
  const offenders = [];
  for (const [hex, count] of colorUse) {
    const n = nearest(hex);
    if (data.colors[hex] || n.close) inPal += count;
    else { outPal += count; offenders.push({ hex, count, nearestToken: n.token, nearestHex: n.hex, sels: colorSels.get(hex) || [] }); }
  }
  out.colorsSampled = inPal + outPal;
  out.colorsInPalette = inPal;
  out.offenders = offenders.sort((a, b) => b.count - a.count).slice(0, 6);

  // --- guideline typography checks (designsystem.gov.ae/guidelines/typography) ---
  const typo = data.typo;
  const smallBody = [], tightLines = [];
  const bodyEls = [...document.querySelectorAll("p,li,dd,td")]
    .filter((el) => el.getClientRects().length && el.textContent.trim().length > 40).slice(0, 120);
  for (const el of bodyEls) {
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight);
    if (fs < typo.minBody && smallBody.length < 6) {
      smallBody.push({ sel: cssPath(el), px: Math.round(fs) });
    }
    if (lh !== null && lh / fs < typo.minLineRatio - 0.05 && tightLines.length < 6) {
      tightLines.push({ sel: cssPath(el), ratio: Math.round((lh / fs) * 100) / 100 });
    }
  }
  out.bodySampled = bodyEls.length;
  out.smallBody = smallBody;
  out.tightLines = tightLines;

  out.headingOffScale = [];
  out.displayWeightBad = [];
  if (window.innerWidth >= 1024) {
    for (const h of [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].slice(0, 30)) {
      if (!h.getClientRects().length) continue;
      const cs = getComputedStyle(h);
      const px = Math.round(parseFloat(cs.fontSize));
      if (!typo.headingSizes.some((s) => Math.abs(px - s) <= 2) && out.headingOffScale.length < 6) {
        out.headingOffScale.push({ sel: cssPath(h), tag: h.tagName.toLowerCase(), px });
      }
      const w = parseInt(cs.fontWeight, 10) || 400;
      if (px >= 70 && w !== 200 && out.displayWeightBad.length < 4) {
        out.displayWeightBad.push({ sel: cssPath(h), px, weight: w });
      }
    }
  }

  const badWeights = out.fontWeights.filter((w) => {
    const n = parseInt(w, 10);
    return !typo.headingWeights.includes(n) && !typo.bodyWeights.includes(n);
  });
  out.disallowedWeights = badWeights;

  // --- component catalog: which known DLS components are on this page ---
  out.componentsFound = data.components.filter((c) => document.querySelector("." + c));
  out.componentsKnown = data.components.length;

  // --- button sizing vs the DLS spec (heights from @aegov/design-system dist) ---
  const btns = [...document.querySelectorAll(".aegov-btn")].filter((b) => b.getClientRects().length);
  const badBtns = [];
  for (const b of btns.slice(0, 50)) {
    const h = Math.round(b.getBoundingClientRect().height);
    const ok = data.button.heights.some((s) => Math.abs(h - s) <= data.button.tolerance);
    if (!ok) badBtns.push({ height: h, cls: b.className.split(" ").slice(0, 3).join(" "), sel: cssPath(b), text: b.textContent.trim().slice(0, 30) });
  }
  out.buttons = btns.length;
  out.buttonsOffSpec = badBtns.slice(0, 5);
  out.buttonSpec = data.button.heights;

  // --- raw controls not using DLS component classes ---
  const controls = [...document.querySelectorAll("button,input:not([type=hidden]),select,textarea")];
  out.controls = controls.length;
  const inDls = (el) => [...el.classList].some((c) => c.startsWith("aegov-")) ||
    (el.closest("[class*='aegov-']") !== null);
  out.controlsWithAegov = controls.filter(inDls).length;
  out.rawControls = controls.filter((el) => !inDls(el)).slice(0, 10)
    .map((el) => ({ sel: cssPath(el), tag: el.tagName.toLowerCase() + (el.type ? "[" + el.type + "]" : "") }));

  return out;
}

function dlsHighlightInPage(data) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 2000);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  let count = 0;
  const MAX = 60;
  const mark = (el, label) => {
    if (count >= MAX || !el.getClientRects().length) return;
    count++;
    el.setAttribute("data-a11y-lens", "dls");
    el.style.setProperty("outline", "3px dashed #b68a35", "important");
    el.style.setProperty("outline-offset", "2px", "important");
    const r = el.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = label;
    b.style.cssText = `position:absolute;z-index:2147483647;left:${scrollX + r.left}px;top:${scrollY + r.top - 16}px;` +
      "background:#b68a35;color:#fff;font:bold 10px/15px sans-serif;padding:0 5px;border-radius:3px 3px 0 0;pointer-events:none;max-width:340px;white-space:nowrap;overflow:hidden";
    document.body.appendChild(b);
  };

  // off-spec aegov-btn heights
  for (const btn of [...document.querySelectorAll(".aegov-btn")].slice(0, 80)) {
    const h = Math.round(btn.getBoundingClientRect().height);
    if (h > 0 && !data.button.heights.some((s) => Math.abs(h - s) <= data.button.tolerance)) {
      mark(btn, `DLS: ${h}px \u2260 32/40/48/52`);
    }
  }

  // wrong fonts on body-visible headings
  const lang = (document.documentElement.lang || "").toLowerCase();
  const expected = data.fonts[lang.startsWith("ar") ? "ar" : "en"];
  for (const h of [...document.querySelectorAll("h1,h2,h3")].slice(0, 30)) {
    const fam = getComputedStyle(h).fontFamily.toLowerCase();
    if (!expected.heading.some((n) => fam.includes(n))) {
      mark(h, "DLS font: " + fam.split(",")[0].trim().replace(/"/g, ""));
    }
  }

  // off-palette colors on prominent elements
  const toHex = (rgb) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgb);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    return "#" + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, "0")).join("");
  };
  const paletteHex = Object.keys(data.colors);
  const parse = (x) => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)];
  const near = (hex) => {
    const [r, g, b] = parse(hex);
    let best = null, bd = Infinity;
    for (const p of paletteHex) {
      const [pr, pg, pb] = parse(p);
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return { token: data.colors[best], close: bd <= 900 };
  };
  for (const el of [...document.querySelectorAll("a,button,h1,h2,h3,[class*='btn']")].slice(0, 200)) {
    const cs = getComputedStyle(el);
    for (const c of [cs.color, cs.backgroundColor]) {
      const hex = toHex(c);
      if (!hex || hex === "#ffffff" || hex === "#000000" || data.colors[hex]) continue;
      const n = near(hex);
      if (!n.close) { mark(el, `DLS color ${hex} \u2192 ${n.token}`); break; }
    }
  }

  // guideline typography gaps
  for (const el of [...document.querySelectorAll("p,li,dd,td")].slice(0, 150)) {
    if (count >= MAX) break;
    if (!el.getClientRects().length || el.textContent.trim().length <= 40) continue;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight);
    if (fs < data.typo.minBody) mark(el, `DLS: ${Math.round(fs)}px < ${data.typo.minBody}px min body`);
    else if (lh !== null && lh / fs < data.typo.minLineRatio - 0.05) mark(el, `DLS: line-height ${(lh / fs).toFixed(2)} < 1.5`);
  }
  if (window.innerWidth >= 1024) {
    for (const h of [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].slice(0, 30)) {
      const px = Math.round(parseFloat(getComputedStyle(h).fontSize));
      if (!data.typo.headingSizes.some((s) => Math.abs(px - s) <= 2)) {
        mark(h, `DLS: ${px}px off the heading scale`);
      }
    }
  }

  // form controls outside DLS components
  for (const el of [...document.querySelectorAll("button,input:not([type=hidden]),select,textarea")].slice(0, 60)) {
    const inDls = [...el.classList].some((c) => c.startsWith("aegov-")) || el.closest("[class*='aegov-']");
    if (!inDls) mark(el, "DLS: not in a DLS component");
  }

  return count;
}

/* ---------- message router ---------- */

const DEFAULT_SETTINGS = { level: "wcag22aa", bestPractice: false, flowInterval: 4, lang: "en", framework: "html", mode: "a11y", dlsContrast: false };

async function exec(tabId, func, args, allFrames = false) {
  const results = await EXT.scripting.executeScript({
    target: { tabId, allFrames },
    func,
    args: args || [],
  });
  return results[0]?.result;
}

EXT.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    const { op, tabId } = msg;
    switch (op) {
      case "injectAxe":
        await EXT.scripting.executeScript({
          target: { tabId, allFrames: true },
          files: ["vendor/axe.min.js"],
        });
        return { result: true };
      case "runAxe":
        return { result: await exec(tabId, runAxeInPage, [msg.runOnly ?? null]) };
      case "highlight":
        return { result: await exec(tabId, highlightInPage, [msg.selector]) };
      case "highlightAll":
        return { result: await exec(tabId, highlightAllInPage, [msg.items]) };
      case "clearHighlights":
        await EXT.scripting.executeScript({ target: { tabId, allFrames: true }, func: clearInPage });
        return { result: true };
      case "domCount":
        return { result: await exec(tabId, () => document.querySelectorAll("*").length) };
      case "staleInstall":
        return { result: await exec(tabId, staleInstallInPage) };
      case "staleCheck":
        return { result: await exec(tabId, staleCheckInPage) };
      case "dlsCheck":
        return { result: await exec(tabId, dlsCheckInPage, [DLS_DATA]) };
      case "captureTab": {
        const tab = await EXT.tabs.get(tabId);
        const dataUrl = await EXT.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 75 });
        return { result: dataUrl };
      }
      case "dlsHighlight":
        return { result: await exec(tabId, dlsHighlightInPage, [DLS_DATA]) };
      case "helper":
        if (!HELPERS[msg.name]) throw new Error("unknown helper: " + msg.name);
        return { result: await exec(tabId, HELPERS[msg.name]) };
      case "pickStart":
        return { result: await exec(tabId, pickStartInPage) };
      case "pickCheck":
        return { result: await exec(tabId, pickCheckInPage) };
      case "applyFix":
        return { result: await exec(tabId, applyFixInPage, [msg.selector, msg.patch]) };
      case "undoFix":
        return { result: await exec(tabId, undoFixInPage, [msg.selector]) };
      case "applyFixAll":
        return { result: await exec(tabId, applyFixAllInPage, [msg.items]) };
      case "undoAll":
        return { result: await exec(tabId, undoAllInPage) };
      case "aiFix": {
        const { aiKey, aiModel } = await EXT.storage.local.get(["aiKey", "aiModel"]);
        if (!aiKey) throw new Error("No API key set — add one in Options");
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": aiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: aiModel || "claude-opus-4-8",
            max_tokens: 1024,
            messages: [{ role: "user", content: msg.prompt }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message || res.statusText);
        }
        const json = await res.json();
        return { result: json.content.filter((b) => b.type === "text").map((b) => b.text).join("") };
      }
      case "storeGet":
        return { result: (await EXT.storage.local.get(msg.key))[msg.key] ?? null };
      case "storeSet":
        await EXT.storage.local.set({ [msg.key]: msg.value });
        return { result: true };
      case "settingsGet": {
        const stored = await EXT.storage.sync.get("settings");
        return { result: { ...DEFAULT_SETTINGS, ...(stored.settings || {}) } };
      }
      case "settingsSet": {
        const stored = await EXT.storage.sync.get("settings");
        await EXT.storage.sync.set({ settings: { ...(stored.settings || {}), ...msg.value } });
        return { result: true };
      }
      default:
        throw new Error("unknown op: " + op);
    }
  })()
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err?.message || String(err) }));
  return true; // keep the message channel open for the async response
});
