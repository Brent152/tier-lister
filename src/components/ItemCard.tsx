import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "../types";
import { textOn } from "../color";
import { useStore } from "../store";
import { itemMatches, normalizeQuery } from "../search";
import { ModalShell } from "./NewListDialog";

type Props = {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
};

export function ItemCard({ item, onEdit, onDelete }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const search = useStore((s) => s.search);
  const nq = normalizeQuery(search);
  const highlighted = nq.length > 0 && itemMatches(item, nq);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const hasImage = !!item.image;
  const bgColor = !hasImage && item.color ? item.color : null;
  const swatchStyle: React.CSSProperties = bgColor
    ? { background: bgColor, color: textOn(bgColor) }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative w-20 shrink-0 select-none cursor-grab active:cursor-grabbing"
    >
      <div
        className={`w-20 h-20 border border-slate-700 rounded overflow-hidden flex items-center justify-center text-center ${
          bgColor ? "" : "bg-slate-800"
        } ${
          highlighted
            ? "ring-2 ring-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.55)]"
            : ""
        }`}
        style={swatchStyle}
      >
        {hasImage ? (
          <img
            src={item.image!}
            alt={item.label}
            className="w-full h-full object-cover"
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span
            className={`text-xs px-1 line-clamp-3 font-medium ${bgColor ? "" : "text-slate-300"}`}
          >
            {item.label}
          </span>
        )}
      </div>
      <div className="text-[11px] text-slate-300 mt-1 truncate" title={item.label}>
        {item.label}
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-slate-900/80 text-slate-300 text-xs opacity-0 group-hover:opacity-100 hover:text-white"
        title="Edit"
      >
        ✎
      </button>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.label}"?`)) onDelete();
        }}
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded bg-slate-900/80 text-slate-300 text-xs opacity-0 group-hover:opacity-100 hover:text-red-400"
        title="Delete"
      >
        ×
      </button>
      {item.description && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo(true);
          }}
          className="absolute bottom-7 right-0.5 w-5 h-5 rounded bg-slate-900/80 text-slate-300 text-xs opacity-0 group-hover:opacity-100 hover:text-blue-400"
          title="Info"
        >
          i
        </button>
      )}
      {showInfo && (
        <ModalShell onClose={() => setShowInfo(false)} title={item.label}>
          <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{item.description}</p>
        </ModalShell>
      )}
    </div>
  );
}
