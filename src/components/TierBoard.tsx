import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { useStore } from "../store";
import type { Item, TierList } from "../types";
import { UNRANKED_ID } from "../types";
import { ItemEditor } from "./ItemEditor";
import { TierRow } from "./TierRow";
import { UnrankedPool } from "./UnrankedPool";

export function TierBoard({ list }: { list: TierList }) {
  const moveItem = useStore((s) => s.moveItem);
  const deleteItem = useStore((s) => s.deleteItem);
  const renameList = useStore((s) => s.renameList);
  const addTier = useStore((s) => s.addTier);
  const saveAsPreset = useStore((s) => s.saveCurrentTiersAsPreset);

  const [editing, setEditing] = useState<Item | null>(null);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(list.name);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const itemsByTier = useMemo(() => {
    const map = new Map<string, Item[]>();
    map.set(UNRANKED_ID, []);
    list.tiers.forEach((t) => map.set(t.id, []));
    list.items.forEach((it) => {
      const key = it.tier ?? UNRANKED_ID;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    });
    return map;
  }, [list.tiers, list.items]);

  const tierIdSet = useMemo(() => new Set(list.tiers.map((t) => t.id)), [list.tiers]);

  const containerOfId = (id: string): string | null => {
    if (id === UNRANKED_ID || tierIdSet.has(id)) return id;
    const item = list.items.find((i) => i.id === id);
    if (!item) return null;
    return item.tier ?? UNRANKED_ID;
  };

  // Prefer pointer-within hits (so dropping inside a tier's items area always
  // resolves to that tier), falling back to rectIntersection for edge cases.
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (activeIdStr === overIdStr) return;

    const activeContainer = containerOfId(activeIdStr);
    const overContainer = containerOfId(overIdStr);
    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer) return; // same container — handled on drop

    // Cross-container: move item to over's container at the over position
    const overItems = list.items.filter((i) => (i.tier ?? UNRANKED_ID) === overContainer);
    const targetIndex =
      overIdStr === overContainer
        ? overItems.length
        : Math.max(0, overItems.findIndex((i) => i.id === overIdStr));
    moveItem(activeIdStr, overContainer === UNRANKED_ID ? null : overContainer, targetIndex);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const container = containerOfId(activeIdStr);
    if (!container) return;

    const containerItems = list.items.filter((i) => (i.tier ?? UNRANKED_ID) === container);
    const oldIndex = containerItems.findIndex((i) => i.id === activeIdStr);
    let newIndex: number;
    if (overIdStr === container) {
      newIndex = containerItems.length - 1;
    } else {
      newIndex = containerItems.findIndex((i) => i.id === overIdStr);
    }
    if (newIndex === -1 || oldIndex === newIndex) return;
    moveItem(activeIdStr, container === UNRANKED_ID ? null : container, newIndex);
  };

  const activeItem = activeId ? list.items.find((i) => i.id === activeId) : null;

  const commitName = () => {
    setEditingName(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== list.name) {
      void renameList(trimmed);
    } else {
      setDraftName(list.name);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900">
        {editingName ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setEditingName(false);
                setDraftName(list.name);
              }
            }}
            className="text-xl font-semibold bg-slate-800 border border-slate-700 rounded px-2 py-1"
          />
        ) : (
          <h2
            className="text-xl font-semibold cursor-text hover:bg-slate-800 px-2 py-1 rounded"
            onClick={() => {
              setDraftName(list.name);
              setEditingName(true);
            }}
            title="Click to rename"
          >
            {list.name}
          </h2>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addTier("New", "#64748b", "bottom")}
            className="text-sm px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
          >
            + Add tier
          </button>
          <button
            type="button"
            onClick={() => {
              const name = prompt("Save current tiers as preset. Preset name:");
              if (name && name.trim()) void saveAsPreset(name.trim());
            }}
            className="text-sm px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
          >
            Save tiers as preset
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="border border-slate-700 rounded overflow-hidden">
            {list.tiers.map((tier) => (
              <TierRow
                key={tier.id}
                tier={tier}
                items={itemsByTier.get(tier.id) ?? []}
                onEditItem={(it) => {
                  setEditing(it);
                  setShowItemEditor(true);
                }}
                onDeleteItem={(id) => deleteItem(id)}
              />
            ))}
          </div>

          <UnrankedPool
            items={itemsByTier.get(UNRANKED_ID) ?? []}
            onAddItem={() => {
              setEditing(null);
              setShowItemEditor(true);
            }}
            onEditItem={(it) => {
              setEditing(it);
              setShowItemEditor(true);
            }}
            onDeleteItem={(id) => deleteItem(id)}
          />

          <DragOverlay>
            {activeItem && (
              <div className="w-20 select-none">
                <div className="w-20 h-20 bg-slate-700 border border-slate-500 rounded overflow-hidden flex items-center justify-center text-center shadow-2xl">
                  {activeItem.image ? (
                    <img
                      src={activeItem.image}
                      alt={activeItem.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-200 px-1 line-clamp-3">{activeItem.label}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-200 mt-1 truncate">{activeItem.label}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {showItemEditor && (
        <ItemEditor item={editing} onClose={() => setShowItemEditor(false)} />
      )}
    </div>
  );
}
