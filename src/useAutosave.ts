import { useEffect, useRef } from "react";
import { api } from "./api";
import { useStore } from "./store";
import type { TierList } from "./types";

const DEBOUNCE_MS = 300;

export function useAutosave(): void {
  const currentList = useStore((s) => s.currentList);
  const currentListName = useStore((s) => s.currentListName);
  const pushToast = useStore((s) => s.pushToast);

  // Tracks the snapshot we know is saved (or just loaded). Keyed by listName so
  // switching lists resets the comparison without firing a save on the new list.
  const savedSnapshotRef = useRef<{ name: string; json: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentList || !currentListName) {
      return;
    }
    const json = JSON.stringify(currentList);

    // List just (re)loaded — sync snapshot, no save.
    if (
      savedSnapshotRef.current === null ||
      savedSnapshotRef.current.name !== currentListName
    ) {
      savedSnapshotRef.current = { name: currentListName, json };
      return;
    }

    // No actual change.
    if (savedSnapshotRef.current.json === json) {
      return;
    }

    // Debounce save.
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow(currentListName, currentList, json);
    }, DEBOUNCE_MS);

    async function saveNow(name: string, list: TierList, snapshot: string) {
      try {
        await api.saveList(name, list);
        savedSnapshotRef.current = { name, json: snapshot };
      } catch (e) {
        pushToast(`Save failed: ${(e as Error).message}`);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentList, currentListName, pushToast]);
}
