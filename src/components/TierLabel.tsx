import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import type { Tier } from "../types";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#475569",
];

export function TierLabel({ tier }: { tier: Tier }) {
  const editTier = useStore((s) => s.editTier);
  const deleteTier = useStore((s) => s.deleteTier);
  const addTier = useStore((s) => s.addTier);

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(tier.label);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLabel(tier.label);
  }, [tier.label]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const commitLabel = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== tier.label) editTier(tier.id, { label: trimmed });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-16 h-full min-h-[6rem] flex items-center justify-center text-2xl font-bold text-slate-900"
        style={{ background: tier.color }}
      >
        {tier.label}
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="absolute left-full top-0 ml-2 bg-slate-900 border border-slate-700 rounded-lg p-3 z-30 w-60 shadow-xl"
        >
          <label className="text-xs text-slate-400">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitLabel();
                setOpen(false);
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 mt-1 mb-3 text-sm"
          />
          <div className="text-xs text-slate-400 mb-1">Color</div>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => editTier(tier.id, { color: c })}
                className={`w-6 h-6 rounded ${tier.color === c ? "ring-2 ring-white" : ""}`}
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                addTier("New", "#64748b", { afterId: tier.id });
                setOpen(false);
              }}
              className="text-left text-sm px-2 py-1 rounded hover:bg-slate-800"
            >
              + Add tier below
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete tier "${tier.label}"? Items in it move to Unranked.`)) {
                  deleteTier(tier.id);
                  setOpen(false);
                }
              }}
              className="text-left text-sm px-2 py-1 rounded hover:bg-slate-800 text-red-400"
            >
              Delete tier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
