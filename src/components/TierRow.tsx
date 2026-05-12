import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { Item, Tier } from "../types";
import { ItemCard } from "./ItemCard";
import { TierLabel } from "./TierLabel";

type Props = {
  tier: Tier;
  items: Item[];
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
};

export function TierRow({ tier, items, onEditItem, onDeleteItem }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id });
  const ids = items.map((i) => i.id);
  return (
    <div className="flex border-b border-slate-800 min-h-[6rem]">
      <TierLabel tier={tier} />
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 flex flex-wrap gap-2 items-start ${isOver ? "bg-slate-800/40" : ""}`}
      >
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          {items.map((it) => (
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
