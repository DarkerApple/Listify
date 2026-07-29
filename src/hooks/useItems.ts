import { useCallback, useEffect, useRef, useState } from 'react';
import type { Item } from '../types';
import { loadItems, saveItems } from '../lib/storage';
import { newId } from '../lib/id';
import { splitIntoItems } from '../lib/parse';

export interface RemovedItem {
  item: Item;
  /** Where it sat in the array, so undo restores the original order. */
  index: number;
}

/**
 * The whole data layer. Items live in React state and are mirrored to
 * localStorage on every change — no server, no account, no sync.
 */
export function useItems() {
  const [items, setItems] = useState<Item[]>(loadItems);
  const [lastRemoved, setLastRemoved] = useState<RemovedItem | null>(null);
  const undoTimer = useRef<number | null>(null);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => () => {
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  }, []);

  /** Capture raw composer text. Multi-line input becomes multiple items. */
  const capture = useCallback((raw: string, parentId: string | null = null): number => {
    const lines = splitIntoItems(raw);
    if (lines.length === 0) return 0;
    const now = Date.now();
    const created: Item[] = lines.map((text, i) => ({
      id: newId(),
      text,
      // Stagger by a millisecond so a pasted list keeps the order it was typed
      // in once the page is sorted oldest-first.
      createdAt: now + i,
      done: false,
      doneAt: null,
      replies: [],
      parentId,
    }));
    setItems((prev) => [...created, ...prev]);
    return created.length;
  }, []);

  const toggle = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done, doneAt: item.done ? null : Date.now() } : item,
      ),
    );
  }, []);

  const edit = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text: trimmed } : item)));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      setLastRemoved({ item: prev[index], index });
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => setLastRemoved(null), 8000);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const undoRemove = useCallback(() => {
    setLastRemoved((removed) => {
      if (!removed) return null;
      setItems((prev) => {
        const next = [...prev];
        next.splice(Math.min(removed.index, next.length), 0, removed.item);
        return next;
      });
      return null;
    });
  }, []);

  const dismissUndo = useCallback(() => setLastRemoved(null), []);

  /** Add a message to an item's thread. */
  const reply = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const message = { id: newId(), text: trimmed, createdAt: Date.now() };
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, replies: [...item.replies, message] } : item)),
    );
  }, []);

  const removeReply = useCallback((id: string, replyId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, replies: item.replies.filter((r) => r.id !== replyId) } : item,
      ),
    );
  }, []);

  /**
   * Promote a thread message to its own checklist item. Elaborating on an idea
   * usually surfaces the actual next step — this is how that step escapes the
   * thread without retyping it.
   */
  const promoteReply = useCallback((id: string, replyId: string) => {
    setItems((prev) => {
      const parent = prev.find((item) => item.id === id);
      const message = parent?.replies.find((r) => r.id === replyId);
      if (!parent || !message) return prev;
      const promoted: Item = {
        id: newId(),
        text: message.text,
        createdAt: Date.now(),
        done: false,
        doneAt: null,
        replies: [],
        parentId: parent.id,
      };
      return [
        promoted,
        ...prev.map((item) =>
          item.id === id ? { ...item, replies: item.replies.filter((r) => r.id !== replyId) } : item,
        ),
      ];
    });
  }, []);

  const clearDone = useCallback(() => {
    setItems((prev) => prev.filter((item) => !item.done));
  }, []);

  const replaceAll = useCallback((next: Item[]) => {
    setItems(next);
  }, []);

  return {
    items,
    capture,
    toggle,
    edit,
    remove,
    lastRemoved,
    undoRemove,
    dismissUndo,
    reply,
    removeReply,
    promoteReply,
    clearDone,
    replaceAll,
  };
}
