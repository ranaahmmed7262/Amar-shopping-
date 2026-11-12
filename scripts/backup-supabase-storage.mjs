import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const outputRoot = path.resolve(process.env.BACKUP_STORAGE_DIR || "/tmp/amar-shopping-backup/storage");

if (!baseUrl || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Storage API ${response.status}: ${detail}`);
  }
  return response;
}

async function listPage(bucket, prefix, offset) {
  const response = await api(`${baseUrl}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } })
  });
  return response.json();
}

function safeFilePath(bucket, objectPath) {
  const target = path.resolve(outputRoot, bucket, objectPath);
  if (!target.startsWith(outputRoot + path.sep)) throw new Error("Unsafe Storage object path rejected.");
  return target;
}

async function walk(bucket, prefix = "") {
  let offset = 0;
  while (true) {
    const items = await listPage(bucket, prefix, offset);
    if (!Array.isArray(items)) throw new Error(`Unexpected Storage listing for bucket ${bucket}`);
    for (const item of items) {
      if (!item || typeof item.name !== "string" || item.name.includes("\\") || item.name.split("/").includes("..")) {
        throw new Error(`Unsafe or malformed Storage entry in bucket ${bucket}`);
      }
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id) {
        await walk(bucket, objectPath);
        continue;
      }
      const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
      const response = await api(`${baseUrl}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodedPath}`);
      const target = safeFilePath(bucket, objectPath);
      await mkdir(path.dirname(target), { recursive: true });
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(target, bytes, { flag: "wx" });
      process.stdout.write(`Saved Storage object: ${bucket}/${objectPath} (${bytes.length} bytes)\\n`);
    }
    if (items.length < 100) break;
    offset += items.length;
  }
}

const bucketResponse = await api(`${baseUrl}/storage/v1/bucket`);
const buckets = await bucketResponse.json();
if (!Array.isArray(buckets)) throw new Error("Could not enumerate Storage buckets.");
await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, "bucket-manifest.json"), JSON.stringify(buckets.map(({ id, name, public: isPublic, file_size_limit, allowed_mime_types }) => ({ id, name, public: isPublic, file_size_limit, allowed_mime_types })), null, 2));
for (const bucket of buckets) {
  if (!bucket?.name) throw new Error("A Storage bucket had no name.");
  await walk(bucket.name);
}
process.stdout.write(`Storage backup complete: ${buckets.length} bucket(s).\\n`);
