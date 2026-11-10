import fs from "node:fs";

const SITE_URL = "https://amar-shopping-bd-live.onrender.com";
const HTML_PATH = new URL("../index.html", import.meta.url);
const SITEMAP_PATH = new URL("../sitemap.xml", import.meta.url);

function getPublicConfig() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const url = html.match(/const\s+SUPABASE_URL\s*=\s*["']([^"']+)["']/);
  const key = html.match(/const\s+SUPABASE_KEY\s*=\s*["']([^"']+)["']/);
  if (!url || !key) throw new Error("Public Supabase configuration not found; sitemap was not changed.");
  const parsed = new URL(url[1]);
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
    throw new Error("Supabase URL validation failed; sitemap was not changed.");
  }
  return { url: parsed.origin, key: key[1] };
}

async function main() {
  const { url, key } = getPublicConfig();
  const endpoint = new URL("/rest/v1/products", url);
  endpoint.search = new URLSearchParams({
    select: "id,created_at",
    status: "eq.approved",
    order: "id.asc",
    limit: "50000"
  }).toString();

  const response = await fetch(endpoint, {
    headers: { apikey: key, Accept: "application/json", "Cache-Control": "no-store" },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) {
    throw new Error(`Supabase product query failed (HTTP ${response.status}); sitemap was not changed.`);
  }

  const products = await response.json();
  if (!Array.isArray(products)) throw new Error("Unexpected Supabase response; sitemap was not changed.");
  const ids = products.map((product) => Number(product.id));
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error("Invalid product ID returned; sitemap was not changed.");
  }

  const urls = [
    `  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq></url>`,
    ...products.map((product, index) => {
      const id = ids[index];
      const created = product.created_at ? new Date(product.created_at) : null;
      const lastmod = created && !Number.isNaN(created.valueOf())
        ? `<lastmod>${created.toISOString().slice(0, 10)}</lastmod>`
        : "";
      return `  <url><loc>${SITE_URL}/?product=${id}</loc>${lastmod}<changefreq>weekly</changefreq></url>`;
    })
  ];

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    ''
  ].join("\n");

  const current = fs.existsSync(SITEMAP_PATH) ? fs.readFileSync(SITEMAP_PATH, "utf8") : "";
  if (current === sitemap) {
    console.log(`Sitemap already current: ${products.length} approved products.`);
    return;
  }
  fs.writeFileSync(SITEMAP_PATH, sitemap, "utf8");
  console.log(`Sitemap refreshed: homepage + ${products.length} approved products.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
