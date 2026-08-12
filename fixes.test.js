const { suggestFix, contrastFix, previewPatch, issuesMarkdown } = require("./fixes.js");

let failed = 0;
function assert(cond, msg) {
  console.assert(cond, msg);
  if (!cond) failed++;
}

// suggestFix across frameworks
const frameworks = ["html", "react", "vue"];
const imgNode = { html: '<img src="a.png">', target: ["img"], failureSummary: "" };
const inputNode = { html: '<input type="text" id="email">', target: ["#email"], failureSummary: "" };
const btnNode = { html: '<button class="icon"></button>', target: ["button"], failureSummary: "" };

frameworks.forEach(function (fw) {
  const img = suggestFix("image-alt", imgNode, fw);
  assert(img && img.snippet.indexOf('alt="DESCRIBE_IMAGE"') !== -1, "image-alt snippet " + fw);
  assert(img && img.note.length > 0, "image-alt note " + fw);

  const lbl = suggestFix("label", inputNode, fw);
  assert(lbl && lbl.snippet.indexOf("<label") !== -1, "label snippet " + fw);
  if (fw === "react") assert(lbl.snippet.indexOf('htmlFor="email"') !== -1, "label react htmlFor");
  else assert(lbl.snippet.indexOf('for="email"') !== -1, "label " + fw + " for=");

  const btn = suggestFix("button-name", btnNode, fw);
  assert(btn && btn.snippet.indexOf("BUTTON_TEXT") !== -1, "button-name snippet " + fw);
});

// React self-closing img
assert(suggestFix("image-alt", imgNode, "react").snippet.indexOf("/>") !== -1, "react self-closing img");

// unknown rule
assert(suggestFix("nope", imgNode, "html") === null, "unknown ruleId null");

// contrastFix
const summary = "Element has insufficient color contrast of 2.85 (foreground color: #9e9e9e, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1";
const cf = contrastFix(summary);
assert(cf !== null, "contrastFix parses sample");
assert(cf.from === "#9e9e9e", "contrastFix from");
assert(cf.bg === "#ffffff", "contrastFix bg");
assert(cf.required === 4.5, "contrastFix required");
assert(cf.ratio >= 4.5, "contrastFix ratio >= 4.5, got " + (cf && cf.ratio));
assert(/^#[0-9a-f]{6}$/.test(cf.to), "contrastFix to is 6-digit hex");
assert(cf.to !== "#9e9e9e", "contrastFix color changed");

// liberal parsing: short hex, alternate labels, 3:1
const cf2 = contrastFix("foreground: #999, background: #fff. Expected contrast ratio of 3:1");
assert(cf2 && cf2.required === 3 && cf2.ratio >= 3, "contrastFix liberal parse");
assert(contrastFix("no colors here") === null, "contrastFix null on garbage");

// previewPatch shapes
const p1 = previewPatch("image-alt", imgNode);
assert(p1 && p1.attrs.alt === "Description placeholder", "previewPatch image-alt");
const p2 = previewPatch("button-name", btnNode);
assert(p2 && p2.attrs["aria-label"] === "Description placeholder", "previewPatch button-name");
const p3 = previewPatch("color-contrast", { html: "<p>x</p>", target: ["p"], failureSummary: summary });
assert(p3 && p3.styles.color === cf.to, "previewPatch color-contrast");
assert(previewPatch("color-contrast", { failureSummary: "junk" }) === null, "previewPatch contrast null");
const p4 = previewPatch("aria-hidden-focus", {});
assert(p4 && p4.attrs.tabindex === "-1", "previewPatch aria-hidden-focus");
const p5 = previewPatch("html-has-lang", {});
assert(p5 && p5.attrs.lang === "en", "previewPatch html-has-lang");
assert(previewPatch("heading-order", {}) === null, "previewPatch others null");

// issuesMarkdown
const report = {
  url: "https://example.com",
  scannedAt: "2026-08-12T10:00:00Z",
  ruleSet: "wcag21aa",
  violations: [
    {
      id: "image-alt",
      impact: "critical",
      help: "Images must have alternate text",
      description: "Ensures <img> elements have alternate text",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.8/image-alt",
      nodes: [imgNode],
      nodeTotal: 1
    },
    {
      id: "color-contrast",
      impact: "serious",
      help: "Elements must meet minimum color contrast",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
      nodes: [{ html: "<p>low</p>", target: ["p.low"], failureSummary: summary }],
      nodeTotal: 1
    }
  ]
};
const manual = [
  { title: "Keyboard trap", wcag: "2.1.2", verdict: "fail", findings: [{ finding: "Focus trapped in modal", note: "Esc does not close", selector: ".modal" }] },
  { title: "Zoom", wcag: "1.4.4", verdict: "pass", findings: [] }
];
const md = issuesMarkdown(report, manual);
assert(md.indexOf("# Accessibility Report") !== -1, "md H1");
assert(md.indexOf("https://example.com") !== -1, "md url");
assert(md.indexOf("## image-alt: Images must have alternate text") !== -1, "md violation heading");
assert(md.indexOf("## color-contrast:") !== -1, "md contrast heading");
assert(md.indexOf("```html") !== -1, "md fenced code");
assert(md.indexOf("- [ ] Fix `img`") !== -1, "md checklist");
assert(md.indexOf("### Suggested fix") !== -1, "md suggested fix");
assert(md.indexOf("## Manual check failures") !== -1, "md manual section");
assert(md.indexOf("Keyboard trap") !== -1, "md manual fail included");
assert(md.indexOf("Zoom") === -1, "md manual pass excluded");
assert(issuesMarkdown({ url: "x", violations: [] }, null).indexOf("# Accessibility Report") !== -1, "md null manual ok");

if (failed) {
  console.error(failed + " assertion(s) failed");
  process.exit(1);
}
console.log("All tests passed");
