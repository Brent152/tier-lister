import { create } from "zustand";
import { api } from "./api";
import { newId } from "./ids";
import type { Item, ListSummary, Preset, Tier, TierList } from "./types";

export type Toast = { id: string; message: string };

type State = {
  lists: ListSummary[];
  presets: Preset[];
  currentList: TierList | null;
  currentListName: string | null;
  toasts: Toast[];
  /** Transient UI search query. Deliberately NOT part of currentList, so it
   * never serializes/autosaves to the list JSON. */
  search: string;
};

type Actions = {
  refreshLists: () => Promise<void>;
  refreshPresets: () => Promise<void>;
  loadList: (name: string) => Promise<void>;
  closeList: () => void;
  createList: (name: string, presetId: string) => Promise<void>;
  deleteList: (name: string) => Promise<void>;
  renameList: (newName: string) => Promise<void>;

  addItem: (label: string, image: string | null, color: string | null, description: string | null) => void;
  editItem: (itemId: string, patch: Partial<Pick<Item, "label" | "image" | "color" | "description">>) => void;
  deleteItem: (itemId: string) => void;
  moveItem: (itemId: string, toTier: string | null, toIndex: number) => void;

  addTier: (label: string, color: string, position: "top" | "bottom" | { afterId: string }) => void;
  editTier: (tierId: string, patch: Partial<Pick<Tier, "label" | "color">>) => void;
  deleteTier: (tierId: string) => void;

  saveCurrentTiersAsPreset: (presetName: string) => Promise<void>;

  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;

  setSearch: (query: string) => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  lists: [],
  presets: [],
  currentList: null,
  currentListName: null,
  toasts: [],
  search: "",

  refreshLists: async () => {
    try {
      set({ lists: await api.listLists() });
    } catch (e) {
      get().pushToast(`Failed to load lists: ${(e as Error).message}`);
    }
  },

  refreshPresets: async () => {
    try {
      set({ presets: await api.listPresets() });
    } catch (e) {
      get().pushToast(`Failed to load presets: ${(e as Error).message}`);
    }
  },

  loadList: async (name) => {
    try {
      const list = await api.getList(name);
      set({ currentList: list, currentListName: name, search: "" });
    } catch (e) {
      get().pushToast(`Failed to load "${name}": ${(e as Error).message}`);
    }
  },

  closeList: () => set({ currentList: null, currentListName: null, search: "" }),

  createList: async (name, presetId) => {
    try {
      const newList = await api.createList(name, presetId);
      set({ currentList: newList, currentListName: name });
      await get().refreshLists();
    } catch (e) {
      get().pushToast(`Failed to create list: ${(e as Error).message}`);
    }
  },

  deleteList: async (name) => {
    try {
      await api.deleteList(name);
      if (get().currentListName === name) {
        set({ currentList: null, currentListName: null });
      }
      await get().refreshLists();
    } catch (e) {
      get().pushToast(`Failed to delete: ${(e as Error).message}`);
    }
  },

  renameList: async (newName) => {
    const old = get().currentListName;
    if (!old) return;
    try {
      await api.renameList(old, newName);
      set((s) => ({
        currentListName: newName,
        currentList: s.currentList ? { ...s.currentList, name: newName } : null,
      }));
      await get().refreshLists();
    } catch (e) {
      get().pushToast(`Failed to rename: ${(e as Error).message}`);
    }
  },

  addItem: (label, image, color, description) =>
    set((s) => {
      if (!s.currentList) return s;
      const item: Item = { id: newId(), label, image, color, description, tier: null };
      return { currentList: { ...s.currentList, items: [...s.currentList.items, item] } };
    }),

  editItem: (itemId, patch) =>
    set((s) => {
      if (!s.currentList) return s;
      return {
        currentList: {
          ...s.currentList,
          items: s.currentList.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
        },
      };
    }),

  deleteItem: (itemId) =>
    set((s) => {
      if (!s.currentList) return s;
      return {
        currentList: { ...s.currentList, items: s.currentList.items.filter((it) => it.id !== itemId) },
      };
    }),

  moveItem: (itemId, toTier, toIndex) =>
    set((s) => {
      if (!s.currentList) return s;
      const original = s.currentList.items.find((it) => it.id === itemId);
      if (!original) return s;
      const without = s.currentList.items.filter((it) => it.id !== itemId);
      const updated: Item = { ...original, tier: toTier };
      // Insert `updated` so that, when the new array is filtered by tier === toTier,
      // it lands at index `toIndex` in that group.
      const result: Item[] = [];
      let groupCounter = 0;
      let placed = false;
      for (const it of without) {
        if (!placed && (it.tier ?? null) === toTier && groupCounter === toIndex) {
          result.push(updated);
          placed = true;
        }
        result.push(it);
        if ((it.tier ?? null) === toTier) groupCounter++;
      }
      if (!placed) result.push(updated);
      // Skip if nothing actually changed (avoids no-op re-renders during dragOver).
      const before = s.currentList.items;
      const same =
        result.length === before.length &&
        result.every((it, i) => it.id === before[i].id && it.tier === before[i].tier);
      if (same) return s;
      return { currentList: { ...s.currentList, items: result } };
    }),

  addTier: (label, color, position) =>
    set((s) => {
      if (!s.currentList) return s;
      const tier: Tier = { id: newId(), label, color };
      const tiers = [...s.currentList.tiers];
      if (position === "top") tiers.unshift(tier);
      else if (position === "bottom") tiers.push(tier);
      else {
        const idx = tiers.findIndex((t) => t.id === position.afterId);
        if (idx === -1) tiers.push(tier);
        else tiers.splice(idx + 1, 0, tier);
      }
      return { currentList: { ...s.currentList, tiers } };
    }),

  editTier: (tierId, patch) =>
    set((s) => {
      if (!s.currentList) return s;
      return {
        currentList: {
          ...s.currentList,
          tiers: s.currentList.tiers.map((t) => (t.id === tierId ? { ...t, ...patch } : t)),
        },
      };
    }),

  deleteTier: (tierId) =>
    set((s) => {
      if (!s.currentList) return s;
      return {
        currentList: {
          ...s.currentList,
          tiers: s.currentList.tiers.filter((t) => t.id !== tierId),
          items: s.currentList.items.map((it) => (it.tier === tierId ? { ...it, tier: null } : it)),
        },
      };
    }),

  saveCurrentTiersAsPreset: async (presetName) => {
    const list = get().currentList;
    if (!list) return;
    try {
      const id = presetName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || newId();
      await api.savePreset({ id, name: presetName, tiers: list.tiers });
      await get().refreshPresets();
    } catch (e) {
      get().pushToast(`Failed to save preset: ${(e as Error).message}`);
    }
  },

  pushToast: (message) =>
    set((s) => ({ toasts: [...s.toasts, { id: newId(), message }] })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setSearch: (query) => set({ search: query }),
}));
