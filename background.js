// A11y Lens background service worker.
// DevTools panel pages cannot use EXT.scripting or EXT.storage directly —
// the panel sends {op, tabId, ...} messages here and this worker does the work.

// Works on Chromium (chrome.*) and Firefox (browser.*, promise-based).
const EXT = globalThis.browser || globalThis.chrome;
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

/* ---------- message router ---------- */

const DEFAULT_SETTINGS = { level: "wcag22aa", bestPractice: false, flowInterval: 4, lang: "en", framework: "html" };

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
      case "staleInstall":
        return { result: await exec(tabId, staleInstallInPage) };
      case "staleCheck":
        return { result: await exec(tabId, staleCheckInPage) };
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
