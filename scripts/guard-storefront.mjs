import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const htmlPath = path.resolve("index.html");
if (!fs.existsSync(htmlPath)) {
  console.error("FAIL: index.html is missing");
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, "utf8");
const requiredAnchors = [
  "adminOtpVerifiedUserId",
  "privateLogo",
  "admin-reveal",
  "email-otp/status",
  "track_order_by_phone",
  "amar-admin-orders-live",
  "loadAdminOrders",
  "All-in-One",
  "Master Control",
  "mountAmarShoppingAffiliateDashboard",
  "affiliateAdminPanel",
];

let failed = false;
const requiredExternalScripts = ["order-management-dashboard.js", "customer-management-dashboard.js", "customer-account-dashboard.js", "daraz-affiliate-admin-dashboard.js"];
for (const file of [...requiredExternalScripts, "scripts/update-sitemap.mjs"]) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error(`FAIL: required external script is missing: ${file}`);
    failed = true;
    continue;
  }
  const result = spawnSync(process.execPath, ["--check", path.resolve(file)], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`FAIL: external script has a JavaScript syntax error: ${file}`);
    if (result.stderr) console.error(result.stderr.trim());
    failed = true;
  } else {
    console.log(`PASS: external script syntax checked: ${file}`);
  }
}

for (const anchor of requiredAnchors) {
  if (!html.includes(anchor)) {
    console.error(`FAIL: protected feature anchor missing: ${anchor}`);
    failed = true;
  } else {
    console.log(`PASS: protected feature anchor present: ${anchor}`);
  }
}

const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
let checked = 0;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "amar-shopping-guard-"));
try {
  for (let i = 0; i < scriptTags.length; i += 1) {
    const attrs = scriptTags[i][1] ?? "";
    const source = scriptTags[i][2] ?? "";
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const typeMatch = attrs.match(/\btype\s*=\s*["']?([^\s"'>]+)/i);
    const type = (typeMatch?.[1] ?? "").toLowerCase();
    if (type === "application/ld+json" || type === "application/json") continue;
    if (!source.trim()) continue;

    const file = path.join(tempDir, `inline-${i + 1}.js`);
    fs.writeFileSync(file, source, "utf8");
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    checked += 1;
    if (result.status !== 0) {
      console.error(`FAIL: inline script #${i + 1} has a JavaScript syntax error`);
      if (result.stderr) console.error(result.stderr.trim());
      failed = true;
    }
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (checked === 0) {
  console.error("FAIL: no inline JavaScript blocks were checked");
  failed = true;
} else if (!failed) {
  console.log(`PASS: syntax checked ${checked} inline JavaScript blocks`);
}

if (failed) process.exit(1);
console.log("PASS: Amar Shopping source regression guard");
