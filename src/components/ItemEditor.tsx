import { useState } from "react";
import { useStore } from "../store";
import type { Item } from "../types";
import { ITEM_COLORS, textOn } from "../color";
import { ModalShell } from "./NewListDialog";

type Props = {
  item: Item | null; // null = adding new
  onClose: () => void;
};

export function ItemEditor({ item, onClose }: Props) {
  const addItem = useStore((s) => s.addItem);
  const editItem = useStore((s) => s.editItem);

  const [label, setLabel] = useState(item?.label ?? "");
  const [image, setImage] = useState(item?.image ?? "");
  const [color, setColor] = useState<string | null>(item?.color ?? null);
  const [description, setDescription] = useState(item?.description ?? "");

  const trimmed = label.trim();
  const canSubmit = trimmed.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const imgValue = image.trim() || null;
    const descValue = description.trim() || null;
    if (item) {
      editItem(item.id, { label: trimmed, image: imgValue, color, description: descValue });
    } else {
      addItem(trimmed, imgValue, color, descValue);
    }
    onClose();
  };

  return (
    <ModalShell onClose={onClose} title={item ? "Edit item" : "Add item"}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Label</span>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Breath of the Wild"
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Image URL (optional)</span>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes about this item..."
            rows={3}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 resize-y"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-slate-400">
            Background color <span className="text-slate-600">(used when no image)</span>
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setColor(null)}
              className={`w-7 h-7 rounded bg-slate-700 text-slate-400 text-xs flex items-center justify-center ${
                color === null ? "ring-2 ring-blue-500" : ""
              }`}
              title="No color"
            >
              ∅
            </button>
            {ITEM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded ${color === c ? "ring-2 ring-white" : ""}`}
                style={{ background: c }}
                title={c}
              />
            ))}
            <input
              value={color ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setColor(v === "" ? null : v);
              }}
              placeholder="#hex"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-16">Preview</span>
          <div
            className="w-20 h-20 border border-slate-700 rounded overflow-hidden flex items-center justify-center text-center"
            style={
              !image.trim() && color
                ? { background: color, color: textOn(color) }
                : { background: "#1e293b" }
            }
          >
            {image.trim() ? (
              <img
                src={image.trim()}
                alt="preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                }}
              />
            ) : (
              <span className="text-xs px-1 line-clamp-3 font-medium">
                {trimmed || "(label)"}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded text-slate-300 hover:bg-slate-800">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500"
          >
            {item ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
