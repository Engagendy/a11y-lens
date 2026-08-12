// A11y Lens fix suggestions. Dependency-free; runs in browser and Node (no DOM used).
// Wrapped in an IIFE: the panel loads this as a classic script sharing the global
// scope with panel.js, and top-level helpers (e.g. contrastRatio) would collide.
(function () {

function parseTag(html) {
  const m = /^<\s*([a-zA-Z][\w-]*)/.exec(html || "");
  return m ? m[1].toLowerCase() : null;
}

function parseAttrs(html) {
  const attrs = {};
  const open = /^<\s*[a-zA-Z][\w-]*([^>]*)>/.exec(html || "");
  if (!open) return attrs;
  const re = /([a-zA-Z_:][-\w:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|[^\s"'>]+))?/g;
  let m;
  while ((m = re.exec(open[1]))) {
    const raw = m[2];
    let val = "";
    if (raw != null) {
      val = m[3] != null ? m[3] : m[4] != null ? m[4] : raw;
    }
    attrs[m[1].toLowerCase()] = val;
  }
  return attrs;
}

function setAttr(html, name, value) {
  const re = new RegExp("(\\s" + name + "\\s*=\\s*)(\"[^\"]*\"|'[^']*'|[^\\s>]+)", "i");
  if (re.test(html)) return html.replace(re, '$1"' + value + '"');
  return html.replace(/^(<\s*[a-zA-Z][\w-]*)/, '$1 ' + name + '="' + value + '"');
}

function removeAttr(html, name) {
  const re = new RegExp("\\s" + name + "\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)", "i");
  return html.replace(re, "");
}

function selfClose(html, framework) {
  if (framework !== "react") return html;
  // JSX requires void elements to self-close
  return html.replace(/\s*\/?>\s*$/, " />").replace(/^(<[^>]*[^/\s])\s*>$/, "$1 />");
}

function firstOpenTag(html) {
  const m = /^<[^>]*>/.exec(html || "");
  return m ? m[0] : html || "";
}

// ---------- WCAG color math ----------

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(rgb) {
  return "#" + rgb.map(function (v) {
    const s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return s.length === 1 ? "0" + s : s;
  }).join("");
}

function relLuminance(rgb) {
  const c = rgb.map(function (v) {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relLuminance(rgb1);
  const l2 = relLuminance(rgb2);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl(rgb) {
  const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(hsl) {
  const h = hsl[0], s = hsl[1], l = hsl[2];
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  function hue(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
}

function contrastFix(failureSummary) {
  if (typeof failureSummary !== "string") return null;
  const fgM = /foreground(?:\s+color)?:\s*(#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6})/i.exec(failureSummary);
  const bgM = /background(?:\s+color)?:\s*(#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6})/i.exec(failureSummary);
  const reqM = /ratio\s+of\s+(\d+(?:\.\d+)?)\s*:\s*1/i.exec(failureSummary);
  if (!fgM || !bgM) return null;
  const required = reqM ? parseFloat(reqM[1]) : 4.5;
  const fg = hexToRgb(fgM[1]);
  const bg = hexToRgb(bgM[1]);
  if (!fg || !bg) return null;
  const hsl = rgbToHsl(fg);
  // Move lightness toward the extreme opposite the background's luminance
  const endL = relLuminance(bg) > 0.5 ? 0 : 1;
  const colorAt = function (t) {
    return hslToRgb([hsl[0], hsl[1], hsl[2] + (endL - hsl[2]) * t]);
  };
  let result;
  if (contrastRatio(fg, bg) >= required) {
    result = fg;
  } else if (contrastRatio(colorAt(1), bg) < required) {
    result = colorAt(1);
  } else {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (contrastRatio(colorAt(mid), bg) >= required) hi = mid;
      else lo = mid;
    }
    // Rounding to 8-bit hex can dip below the threshold; nudge until it passes
    let t = hi;
    result = colorAt(t);
    while (t < 1 && contrastRatio(hexToRgb(rgbToHex(result)), bg) < required) {
      t = Math.min(1, t + 0.01);
      result = colorAt(t);
    }
  }
  const to = rgbToHex(result);
  return {
    from: rgbToHex(fg),
    to: to,
    bg: rgbToHex(bg),
    ratio: Math.round(contrastRatio(hexToRgb(to), bg) * 100) / 100,
    required: required
  };
}

// ---------- Fix suggestions ----------

function suggestFix(ruleId, node, framework) {
  framework = framework || "html";
  const html = (node && node.html) || "";
  const attrs = parseAttrs(html);
  const target = (node && node.target && node.target[0]) || "";

  switch (ruleId) {
    case "image-alt": {
      const withAlt = selfClose(setAttr(firstOpenTag(html), "alt", "DESCRIBE_IMAGE"), framework);
      const empty = selfClose(setAttr(firstOpenTag(html), "alt", ""), framework);
      return {
        snippet: withAlt + "\n\n<!-- If purely decorative, use an empty alt instead: -->\n" + empty,
        note: "Add an alt attribute. Replace DESCRIBE_IMAGE with a short description of the image; use alt=\"\" only if the image is decorative."
      };
    }
    case "input-image-alt": {
      return {
        snippet: selfClose(setAttr(firstOpenTag(html), "alt", "DESCRIBE_ACTION"), framework),
        note: "Image inputs need an alt describing the action. Replace DESCRIBE_ACTION (e.g. \"Search\")."
      };
    }
    case "label": {
      const tag = firstOpenTag(html);
      const forAttr = framework === "react" ? "htmlFor" : "for";
      if (attrs.id) {
        return {
          snippet: "<label " + forAttr + '="' + attrs.id + '">LABEL_TEXT</label>\n' + selfClose(tag, framework),
          note: "Associate a visible label via " + forAttr + '="' + attrs.id + '". Replace LABEL_TEXT. Alternatively add aria-label to the control.'
        };
      }
      return {
        snippet: "<label>LABEL_TEXT " + selfClose(tag, framework) + "</label>\n\n<!-- Or without a visible label: -->\n" + selfClose(setAttr(tag, "aria-label", "LABEL_TEXT"), framework),
        note: "Wrap the control in a <label>, or add aria-label. Replace LABEL_TEXT with the field's purpose."
      };
    }
    case "button-name": {
      const tag = firstOpenTag(html);
      return {
        snippet: tag + "BUTTON_TEXT</button>\n\n<!-- Or, for icon-only buttons: -->\n" + setAttr(tag, "aria-label", "BUTTON_TEXT") + "</button>",
        note: "Give the button an accessible name: visible inner text, or aria-label for icon-only buttons. Replace BUTTON_TEXT."
      };
    }
    case "link-name": {
      const tag = firstOpenTag(html);
      return {
        snippet: tag + "LINK_TEXT</a>\n\n<!-- Or, for icon-only links: -->\n" + setAttr(tag, "aria-label", "LINK_TEXT") + "</a>",
        note: "Give the link discernible text: visible inner text, or aria-label for icon-only links. Replace LINK_TEXT with the destination."
      };
    }
    case "html-has-lang": {
      return {
        snippet: '<html lang="en">',
        note: "Declare the page language on the <html> element. Change \"en\" if the page is in another language."
      };
    }
    case "document-title": {
      return {
        snippet: "<head>\n  <title>PAGE_TITLE</title>\n</head>",
        note: "Add a descriptive <title> inside <head>. Replace PAGE_TITLE with the page's purpose."
      };
    }
    case "frame-title": {
      return {
        snippet: setAttr(firstOpenTag(html), "title", "FRAME_TITLE") + "</iframe>",
        note: "Add a title attribute describing the frame's content. Replace FRAME_TITLE."
      };
    }
    case "select-name": {
      const tag = firstOpenTag(html);
      const forAttr = framework === "react" ? "htmlFor" : "for";
      if (attrs.id) {
        return {
          snippet: "<label " + forAttr + '="' + attrs.id + '">LABEL_TEXT</label>\n' + html,
          note: "Associate a label with the select via " + forAttr + ". Replace LABEL_TEXT."
        };
      }
      return {
        snippet: setAttr(tag, "aria-label", "LABEL_TEXT") + "...</select>",
        note: "Add aria-label (or a wrapping <label>) naming the select. Replace LABEL_TEXT."
      };
    }
    case "color-contrast": {
      const fix = contrastFix(node && node.failureSummary);
      if (!fix) {
        return {
          snippet: "/* Increase the contrast between text and background to meet WCAG. */",
          note: "Could not parse the exact colors; darken the text or lighten the background until the contrast ratio passes."
        };
      }
      const sel = target || "SELECTOR";
      let snippet;
      if (framework === "react") {
        snippet = 'style={{ color: "' + fix.to + '" }}\n\n/* Or in CSS: */\n' + sel + " {\n  color: " + fix.to + "; /* was " + fix.from + " */\n}";
      } else {
        snippet = sel + " {\n  color: " + fix.to + "; /* was " + fix.from + " */\n}";
      }
      return {
        snippet: snippet,
        note: "Change the text color from " + fix.from + " to " + fix.to + " (contrast " + fix.ratio + ":1 on " + fix.bg + ", required " + fix.required + ":1). Same hue, adjusted lightness."
      };
    }
    case "heading-order": {
      const tag = parseTag(html);
      const level = tag && /^h([1-6])$/.exec(tag);
      const n = level ? parseInt(level[1], 10) : null;
      return {
        snippet: html,
        note: (n ? "This <h" + n + "> skips a heading level. " : "") + "Heading levels must descend one at a time (h1 -> h2 -> h3). Change this heading to be exactly one level below the previous heading in the document, or restructure preceding headings."
      };
    }
    case "duplicate-id":
    case "duplicate-id-active": {
      if (!attrs.id) return { snippet: html, note: "Ensure every id attribute on the page is unique." };
      return {
        snippet: setAttr(firstOpenTag(html), "id", attrs.id + "-unique"),
        note: 'The id "' + attrs.id + '" is used more than once. Rename this occurrence (e.g. "' + attrs.id + '-unique") and update any for/aria-labelledby/href references.'
      };
    }
    case "area-alt": {
      return {
        snippet: selfClose(setAttr(firstOpenTag(html), "alt", "DESCRIBE_AREA"), framework),
        note: "Each <area> needs alt text describing its link target. Replace DESCRIBE_AREA."
      };
    }
    case "aria-hidden-focus": {
      const tag = firstOpenTag(html);
      return {
        snippet: setAttr(tag, "tabindex", "-1") + "\n\n<!-- Or, if the element should be visible to assistive tech: -->\n" + removeAttr(tag, "aria-hidden"),
        note: 'An aria-hidden element must not be focusable. Add tabindex="-1" (and to focusable descendants), or remove aria-hidden="true".'
      };
    }
    case "meta-viewport": {
      const content = attrs.content || "width=device-width, initial-scale=1";
      const cleaned = content
        .split(",")
        .map(function (p) { return p.trim(); })
        .filter(function (p) { return !/^user-scalable\s*=/i.test(p) && !/^maximum-scale\s*=/i.test(p); })
        .join(", ");
      return {
        snippet: selfClose('<meta name="viewport" content="' + cleaned + '">', framework),
        note: "Remove user-scalable=no and maximum-scale so users can zoom the page."
      };
    }
    default:
      return null;
  }
}

function previewPatch(ruleId, node) {
  switch (ruleId) {
    case "image-alt":
    case "area-alt":
      return { attrs: { alt: "Description placeholder" }, styles: {} };
    case "label":
    case "button-name":
    case "link-name":
    case "select-name":
      return { attrs: { "aria-label": "Description placeholder" }, styles: {} };
    case "color-contrast": {
      const fix = contrastFix(node && node.failureSummary);
      if (!fix) return null;
      return { attrs: {}, styles: { color: fix.to } };
    }
    case "aria-hidden-focus":
      return { attrs: { tabindex: "-1" }, styles: {} };
    case "html-has-lang":
      return { attrs: { lang: "en" }, styles: {} };
    default:
      return null;
  }
}

// ---------- Markdown report ----------

function issuesMarkdown(report, manualResults) {
  const lines = [];
  const violations = (report && report.violations) || [];
  const counts = {};
  let total = 0;
  violations.forEach(function (v) {
    const n = v.nodeTotal || (v.nodes ? v.nodes.length : 0);
    counts[v.impact || "unknown"] = (counts[v.impact || "unknown"] || 0) + n;
    total += n;
  });

  lines.push("# Accessibility Report");
  lines.push("");
  lines.push("- **Page:** " + (report && report.url || "unknown"));
  lines.push("- **Scanned:** " + (report && report.scannedAt || "unknown"));
  lines.push("- **Rule set:** " + (report && report.ruleSet || "default"));
  lines.push("- **Violations:** " + violations.length + " rules, " + total + " elements");
  const order = ["critical", "serious", "moderate", "minor"];
  const byImpact = order
    .filter(function (k) { return counts[k]; })
    .map(function (k) { return counts[k] + " " + k; })
    .join(", ");
  if (byImpact) lines.push("- **By impact:** " + byImpact);
  lines.push("");

  violations.forEach(function (v) {
    lines.push("## " + v.id + ": " + (v.help || v.description || ""));
    lines.push("");
    lines.push("- **Impact:** " + (v.impact || "unknown"));
    if (v.helpUrl) lines.push("- **Reference:** " + v.helpUrl);
    if (v.description) lines.push("- **Description:** " + v.description);
    lines.push("");
    lines.push("### Affected elements");
    lines.push("");
    (v.nodes || []).forEach(function (node) {
      const sel = (node.target || []).join(" ");
      lines.push("`" + sel + "`");
      lines.push("");
      lines.push("```html");
      lines.push(node.html || "");
      lines.push("```");
      if (node.failureSummary) {
        lines.push("");
        lines.push("> " + node.failureSummary.replace(/\n/g, "\n> "));
      }
      lines.push("");
    });
    const first = (v.nodes || [])[0];
    const fix = first ? suggestFix(v.id, first, "html") : null;
    if (fix) {
      lines.push("### Suggested fix");
      lines.push("");
      lines.push(fix.note);
      lines.push("");
      lines.push("```html");
      lines.push(fix.snippet);
      lines.push("```");
      lines.push("");
    }
    lines.push("### Checklist");
    lines.push("");
    (v.nodes || []).forEach(function (node) {
      lines.push("- [ ] Fix `" + (node.target || []).join(" ") + "`");
    });
    lines.push("");
  });

  const fails = (manualResults || []).filter(function (m) { return m.verdict === "fail"; });
  if (fails.length) {
    lines.push("## Manual check failures");
    lines.push("");
    fails.forEach(function (m) {
      lines.push("### " + m.title + (m.wcag ? " (" + m.wcag + ")" : ""));
      lines.push("");
      (m.findings || []).forEach(function (f) {
        lines.push("- [ ] " + (f.finding || "") + (f.selector ? " — `" + f.selector + "`" : "") + (f.note ? " — " + f.note : ""));
      });
      lines.push("");
    });
  }

  return lines.join("\n");
}

const A11yFixes = { suggestFix, contrastFix, previewPatch, issuesMarkdown };
if (typeof module !== "undefined" && module.exports) module.exports = A11yFixes;
if (typeof globalThis !== "undefined") globalThis.A11yFixes = A11yFixes;
})();
