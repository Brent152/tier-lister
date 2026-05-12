import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const LISTS_DIR = path.resolve(process.cwd(), "tier-lists");
const PRESETS_DIR = path.join(LISTS_DIR, "presets");

const DEFAULT_PRESETS = [
  {
    id: "classic-6",
    name: "Classic (S–F)",
    tiers: [
      { id: "s", label: "S", color: "#ef4444" },
      { id: "a", label: "A", color: "#f97316" },
      { id: "b", label: "B", color: "#eab308" },
      { id: "c", label: "C", color: "#22c55e" },
      { id: "d", label: "D", color: "#06b6d4" },
      { id: "f", label: "F", color: "#8b5cf6" },
    ],
  },
  {
    id: "yes-maybe-no",
    name: "Yes / Maybe / No",
    tiers: [
      { id: "yes", label: "Yes", color: "#22c55e" },
      { id: "maybe", label: "Maybe", color: "#eab308" },
      { id: "no", label: "No", color: "#ef4444" },
    ],
  },
  {
    id: "top-mid-bottom",
    name: "Top / Mid / Bottom",
    tiers: [
      { id: "top", label: "Top", color: "#f59e0b" },
      { id: "mid", label: "Mid", color: "#64748b" },
      { id: "bottom", label: "Bottom", color: "#475569" },
    ],
  },
];

const NAME_RE = /^[a-zA-Z0-9_\- ]{1,64}$/;

function safeListPath(name: string): string | null {
  if (!NAME_RE.test(name)) return null;
  const resolved = path.resolve(LISTS_DIR, `${name}.json`);
  if (path.dirname(resolved) !== LISTS_DIR) return null;
  return resolved;
}

function safePresetPath(id: string): string | null {
  if (!NAME_RE.test(id)) return null;
  const resolved = path.resolve(PRESETS_DIR, `${id}.json`);
  if (path.dirname(resolved) !== PRESETS_DIR) return null;
  return resolved;
}

async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

async function ensureSeed(): Promise<void> {
  await fs.mkdir(PRESETS_DIR, { recursive: true });
  for (const preset of DEFAULT_PRESETS) {
    const file = path.join(PRESETS_DIR, `${preset.id}.json`);
    try {
      await fs.access(file);
    } catch {
      await atomicWriteJson(file, preset);
    }
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function listSummaries() {
  const entries = await fs.readdir(LISTS_DIR, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".json")) continue;
    const fullPath = path.join(LISTS_DIR, e.name);
    const raw = await fs.readFile(fullPath, "utf8");
    let itemCount = 0;
    try {
      const parsed = JSON.parse(raw);
      itemCount = Array.isArray(parsed.items) ? parsed.items.length : 0;
    } catch {
      continue;
    }
    const stat = await fs.stat(fullPath);
    out.push({
      name: e.name.replace(/\.json$/, ""),
      itemCount,
      mtime: stat.mtimeMs,
    });
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

async function presetSummaries() {
  const entries = await fs.readdir(PRESETS_DIR, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(PRESETS_DIR, e.name), "utf8");
    try {
      out.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }
  return out;
}

export function fileApiPlugin(): Plugin {
  return {
    name: "tier-lister-file-api",
    async configureServer(server) {
      await ensureSeed();

      server.middlewares.use("/api", async (req, res, next) => {
        const url = req.url || "";
        const method = (req.method || "GET").toUpperCase();
        try {
          // GET /lists
          if (method === "GET" && url === "/lists") {
            return send(res, 200, await listSummaries());
          }
          // POST /lists  (create)
          if (method === "POST" && url === "/lists") {
            const body = (await readBody(req)) as { name?: string; presetId?: string };
            if (!body.name || !body.presetId) return send(res, 400, { error: "name and presetId required" });
            const filePath = safeListPath(body.name);
            const presetPath = safePresetPath(body.presetId);
            if (!filePath) return send(res, 400, { error: "invalid list name" });
            if (!presetPath) return send(res, 400, { error: "invalid preset id" });
            try {
              await fs.access(filePath);
              return send(res, 409, { error: "list already exists" });
            } catch {
              // good — doesn't exist
            }
            const presetRaw = await fs.readFile(presetPath, "utf8");
            const preset = JSON.parse(presetRaw);
            const newList = {
              version: 1,
              name: body.name,
              tiers: preset.tiers,
              items: [],
            };
            await atomicWriteJson(filePath, newList);
            return send(res, 201, newList);
          }
          // /lists/:name
          const listMatch = url.match(/^\/lists\/([^/?]+)$/);
          if (listMatch) {
            const name = decodeURIComponent(listMatch[1]);
            const filePath = safeListPath(name);
            if (!filePath) return send(res, 400, { error: "invalid list name" });
            if (method === "GET") {
              try {
                const raw = await fs.readFile(filePath, "utf8");
                return send(res, 200, JSON.parse(raw));
              } catch {
                return send(res, 404, { error: "not found" });
              }
            }
            if (method === "PUT") {
              const body = await readBody(req);
              await atomicWriteJson(filePath, body);
              return send(res, 200, { ok: true });
            }
            if (method === "DELETE") {
              try {
                await fs.unlink(filePath);
                return send(res, 200, { ok: true });
              } catch {
                return send(res, 404, { error: "not found" });
              }
            }
          }
          // POST /lists/:name/rename
          const renameMatch = url.match(/^\/lists\/([^/?]+)\/rename$/);
          if (renameMatch && method === "POST") {
            const oldName = decodeURIComponent(renameMatch[1]);
            const oldPath = safeListPath(oldName);
            if (!oldPath) return send(res, 400, { error: "invalid list name" });
            const body = (await readBody(req)) as { newName?: string };
            if (!body.newName) return send(res, 400, { error: "newName required" });
            const newPath = safeListPath(body.newName);
            if (!newPath) return send(res, 400, { error: "invalid new name" });
            try {
              await fs.access(newPath);
              return send(res, 409, { error: "target name already exists" });
            } catch {
              // good
            }
            const raw = await fs.readFile(oldPath, "utf8");
            const data = JSON.parse(raw);
            data.name = body.newName;
            await atomicWriteJson(newPath, data);
            await fs.unlink(oldPath);
            return send(res, 200, { ok: true });
          }
          // GET /presets
          if (method === "GET" && url === "/presets") {
            return send(res, 200, await presetSummaries());
          }
          // POST /presets (create custom preset)
          if (method === "POST" && url === "/presets") {
            const body = (await readBody(req)) as { id?: string; name?: string; tiers?: unknown };
            if (!body.id || !body.name || !Array.isArray(body.tiers))
              return send(res, 400, { error: "id, name, tiers required" });
            const presetPath = safePresetPath(body.id);
            if (!presetPath) return send(res, 400, { error: "invalid preset id" });
            await atomicWriteJson(presetPath, { id: body.id, name: body.name, tiers: body.tiers });
            return send(res, 201, { ok: true });
          }
          next();
        } catch (err) {
          console.error("[file-api] error:", err);
          return send(res, 500, { error: String(err) });
        }
      });
    },
  };
}
