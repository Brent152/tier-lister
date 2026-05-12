// Returns a readable text color (#1e293b dark or #f8fafc light) for a given hex bg.
export function textOn(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#f8fafc";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e293b" : "#f8fafc";
}

// A varied palette suitable for soaps, foods, generic items.
export const ITEM_COLORS = [
  "#b8443d", // cinnamon red
  "#c2691f", // pumpkin
  "#d4a017", // gold
  "#a07355", // tobacco brown
  "#6ab37f", // mint
  "#4a8c5e", // basil
  "#3d4a3d", // dark sage
  "#1f2d1f", // forest
  "#5b88c9", // blue
  "#a594c8", // lavender
  "#722f37", // wine
  "#c785a8", // rose
  "#e0d2b6", // cream
  "#475569", // slate
];
