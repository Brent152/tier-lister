import type { Item } from "./types";

/** Lowercased, trimmed query. Empty string means "no active search". */
export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

/**
 * True when the item should be considered a search hit. An empty normalized
 * query matches everything (search inactive). Otherwise it's a case-insensitive
 * substring test against the label and the description.
 */
export function itemMatches(item: Item, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  if (item.label.toLowerCase().includes(normalizedQuery)) return true;
  if (item.description && item.description.toLowerCase().includes(normalizedQuery)) return true;
  return false;
}
