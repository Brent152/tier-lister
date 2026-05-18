import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { Item } from "../types";
import { UNRANKED_ID } from "../types";
import { useStore } from "../store";
import { itemMatches, normalizeQuery } from "../search";
import { ItemCard } from "./ItemCard";

type Props = {
  items: Item[];
  onAddItem: () => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
};

export function UnrankedPool({ items, onAddItem, onEditItem, onDeleteItem }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: UNRANKED_ID });
  const search = useStore((s) => s.search);
  const nq = normalizeQuery(search);
  const visible = nq ? items.filter((i) => itemMatches(i, nq)) : items;
  const ids = visible.map((i) => i.id);
  return (
    <div className="border-t border-slate-700 mt-2 bg-slate-950/50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <span className="text-xs uppercase tracking-wider text-slate-400">
          Unranked ({nq ? `${visible.length} of ${items.length}` : items.length})
        </span>
        <button
          type="button"
          onClick={onAddItem}
          className="text-sm px-2 py-1 rounded bg-blue-600 hover:bg-blue-500"
        >
          + Add item
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`p-3 flex flex-wrap gap-2 items-start min-h-[6rem] ${isOver ? "bg-slate-800/40" : ""}`}
      >
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          {visible.length === 0 && (
            <div className="text-sm text-slate-500 italic">
              {nq
                ? "No unranked items match your search."
                : 'Drop items here, or click "Add item" to start.'}
            </div>
          )}
          {visible.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              onEdit={() => onEditItem(it)}
              onDelete={() => onDeleteItem(it.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
