import { useEffect, useState } from "react";
import { useStore } from "../store";
import { NewListDialog } from "./NewListDialog";

export function Sidebar() {
  const lists = useStore((s) => s.lists);
  const refreshLists = useStore((s) => s.refreshLists);
  const refreshPresets = useStore((s) => s.refreshPresets);
  const loadList = useStore((s) => s.loadList);
  const deleteList = useStore((s) => s.deleteList);
  const currentListName = useStore((s) => s.currentListName);

  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    void refreshLists();
    void refreshPresets();
  }, [refreshLists, refreshPresets]);

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 flex flex-col bg-slate-950">
      <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="font-semibold text-slate-100">Tier Lister</h1>
        <button
          onClick={() => setShowNew(true)}
          className="text-2xl leading-none w-8 h-8 rounded hover:bg-slate-800 text-slate-300"
          title="New list"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {lists.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-500">
            No tier lists yet.
            <br />
            Click + to create one.
          </div>
        )}
        {lists.map((l) => (
          <button
            key={l.name}
            onClick={() => loadList(l.name)}
            className={`group w-full text-left px-4 py-2 flex items-center justify-between hover:bg-slate-800 ${
              currentListName === l.name ? "bg-slate-800 text-white" : "text-slate-300"
            }`}
          >
            <span className="truncate flex-1">
              <span className="block truncate">{l.name}</span>
              <span className="block text-xs text-slate-500">{l.itemCount} items</span>
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${l.name}"?`)) void deleteList(l.name);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm(`Delete "${l.name}"?`)) void deleteList(l.name);
                }
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 px-2"
            >
              ×
            </span>
          </button>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
        Files in <code className="text-slate-400">tier-lists/</code>
      </div>

      {showNew && <NewListDialog onClose={() => setShowNew(false)} />}
    </aside>
  );
}
