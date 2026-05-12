import type { ListSummary, Preset, Tier, TierList } from "./types";

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listLists: () => jsonFetch<ListSummary[]>("/api/lists"),
  getList: (name: string) => jsonFetch<TierList>(`/api/lists/${encodeURIComponent(name)}`),
  saveList: (name: string, list: TierList) =>
    jsonFetch<{ ok: true }>(`/api/lists/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(list),
    }),
  createList: (name: string, presetId: string) =>
    jsonFetch<TierList>("/api/lists", {
      method: "POST",
      body: JSON.stringify({ name, presetId }),
    }),
  deleteList: (name: string) =>
    jsonFetch<{ ok: true }>(`/api/lists/${encodeURIComponent(name)}`, { method: "DELETE" }),
  renameList: (name: string, newName: string) =>
    jsonFetch<{ ok: true }>(`/api/lists/${encodeURIComponent(name)}/rename`, {
      method: "POST",
      body: JSON.stringify({ newName }),
    }),

  listPresets: () => jsonFetch<Preset[]>("/api/presets"),
  savePreset: (preset: { id: string; name: string; tiers: Tier[] }) =>
    jsonFetch<{ ok: true }>("/api/presets", {
      method: "POST",
      body: JSON.stringify(preset),
    }),
};
