#!/usr/bin/env node
// A11y Lens CI companion.
// Runs the same axe-core rule sets as the extension, headlessly, against the
// URLs in a11y.config.json. Exit code 1 when the build should fail.
//
//   npm run a11y              — scan and compare against the baseline
//   npm run a11y:baseline     — scan and (re)write the baseline file
//
// failOn: "new" — fail only on violations not present in the baseline
//         "any" — fail on any violation at all

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const require = createRequire(import.meta.url);

// Same cumulative tag map as the extension's panel.
const LEVEL_TAGS = {
  wcag2a: ["wcag2a"],
  wcag2aa: ["wcag2a", "wcag2aa"],
  wcag21aa: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  wcag22aa: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
};

const updateBaseline = process.argv.includes("--update-baseline");
const suggest = process.argv.includes("--suggest");
const A11yFixes = suggest ? require("../fixes.js") : null;
const configPath = process.argv.find((a) => a.endsWith(".json") && !a.includes("baseline")) || "a11y.config.json";
const config = JSON.parse(readFileSync(new URL(configPath, import.meta.url), "utf8"));

const tags = config.level && config.level !== "all" ? [...LEVEL_TAGS[config.level]] : null;
if (tags && config.bestPractice) tags.push("best-practice");

const findingKey = (url, v, node) => `${v.id}|${node.target.join(" ")}|${url}`;

const browser = await chromium.launch();
const page = await browser.newPage();

const allFindings = [];
let scanErrors = 0;

for (const url of config.urls) {
  process.stdout.write(`Scanning ${url} … `);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    let builder = new AxeBuilder({ page });
    if (tags) builder = builder.withTags(tags);
    const results = await builder.analyze();
    let count = 0;
    for (const v of results.violations) {
      for (const node of v.nodes) {
        count++;
        allFindings.push({
          key: findingKey(url, v, node),
          url,
          rule: v.id,
          impact: v.impact || "minor",
          help: v.help,
          helpUrl: v.helpUrl,
          selector: node.target.join(" "),
          html: (node.html || "").slice(0, 200),
          failureSummary: node.failureSummary || "",
        });
      }
    }
    console.log(`${count} violation(s)`);
  } catch (err) {
    scanErrors++;
    console.log(`ERROR — ${err.message}`);
  }
}

await browser.close();

const baselinePath = new URL(config.baseline || "a11y-baseline.json", import.meta.url);

if (updateBaseline) {
  writeFileSync(baselinePath, JSON.stringify({
    createdAt: new Date().toISOString(),
    level: config.level,
    keys: allFindings.map((f) => f.key),
  }, null, 2));
  console.log(`\nBaseline written: ${allFindings.length} finding(s) accepted as known issues.`);
  process.exit(scanErrors ? 1 : 0);
}

const baseline = existsSync(baselinePath)
  ? new Set(JSON.parse(readFileSync(baselinePath, "utf8")).keys)
  : new Set();

const isNew = (f) => !baseline.has(f.key);
const failing = config.failOn === "any" ? allFindings : allFindings.filter(isNew);
const fixed = [...baseline].filter((k) => !allFindings.some((f) => f.key === k)).length;

console.log(`\n═══ A11y summary ═══`);
console.log(`Total violations: ${allFindings.length}`);
console.log(`New vs baseline:  ${allFindings.filter(isNew).length}`);
console.log(`Fixed vs baseline: ${fixed}`);

if (failing.length) {
  console.log(`\n${config.failOn === "any" ? "Violations" : "NEW violations"} (build fails):\n`);
  for (const f of failing) {
    console.log(`  [${f.impact}] ${f.rule} — ${f.help}`);
    console.log(`    page:     ${f.url}`);
    console.log(`    selector: ${f.selector}`);
    console.log(`    html:     ${f.html}`);
    console.log(`    fix:      ${f.helpUrl}`);
    if (A11yFixes) {
      const s = A11yFixes.suggestFix(f.rule, {
        html: f.html,
        target: [f.selector],
        failureSummary: f.failureSummary,
      }, "html");
      if (s) {
        const lines = s.snippet.split("\n");
        console.log(`    suggest:  ${lines[0]}`);
        for (const line of lines.slice(1)) console.log(`              ${line}`);
        if (s.note) console.log(`              ${s.note}`);
      }
    }
    console.log("");
  }
  console.log("Tip: open the page in Chrome/Brave and use the A11y Lens DevTools panel to debug these interactively.");
  process.exit(1);
}

if (scanErrors) {
  console.log("\nSome pages failed to scan — treating as failure.");
  process.exit(1);
}

console.log("\n✅ No " + (config.failOn === "any" ? "" : "new ") + "accessibility violations.");
