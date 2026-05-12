import { useEffect, useState } from "react";
import { useStore } from "../store";

export function NewListDialog({ onClose }: { onClose: () => void }) {
  const presets = useStore((s) => s.presets);
  const createList = useStore((s) => s.createList);
  const refreshPresets = useStore((s) => s.refreshPresets);
  const lists = useStore((s) => s.lists);

  const [name, setName] = useState("");
  const [presetId, setPresetId] = useState<string>("");

  useEffect(() => {
    if (presets.length === 0) void refreshPresets();
  }, [presets.length, refreshPresets]);

  useEffect(() => {
    if (!presetId && presets.length > 0) setPresetId(presets[0].id);
  }, [presets, presetId]);

  const trimmed = name.trim();
  const nameValid = /^[a-zA-Z0-9_\- ]{1,64}$/.test(trimmed);
  const conflicts = lists.some((l) => l.name === trimmed);
  const canSubmit = nameValid && !conflicts && presetId !== "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await createList(trimmed, presetId);
    onClose();
  };

  return (
    <ModalShell onClose={onClose} title="New tier list">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. zelda-games"
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100"
          />
          {trimmed && !nameValid && (
            <span className="text-xs text-red-400">Letters, numbers, dash, underscore, space (max 64).</span>
          )}
          {conflicts && <span className="text-xs text-red-400">A list with that name already exists.</span>}
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-slate-400 mb-1">Tier preset</legend>
          {presets.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2 rounded border cursor-pointer ${
                presetId === p.id ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:bg-slate-800"
              }`}
            >
              <input
                type="radio"
                name="preset"
                checked={presetId === p.id}
                onChange={() => setPresetId(p.id)}
              />
              <span className="flex-1">{p.name}</span>
              <span className="flex gap-1">
                {p.tiers.map((t) => (
                  <span
                    key={t.id}
                    className="w-5 h-5 rounded text-xs flex items-center justify-center font-bold text-slate-900"
                    style={{ background: t.color }}
                    title={t.label}
                  >
                    {t.label.charAt(0)}
                  </span>
                ))}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded text-slate-300 hover:bg-slate-800">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500"
          >
            Create
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function ModalShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-[480px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
