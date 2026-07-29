/** A single message inside an item's thread — an elaboration on the original thought. */
export interface Reply {
  id: string;
  text: string;
  createdAt: number;
}

/**
 * The one unit Listify stores. Every captured thought is an item, and every item
 * is a checkbox — that is what makes the note "automatically" a checklist. The
 * thread (`replies`) is where an idea gets elaborated without leaving the list.
 */
export interface Item {
  id: string;
  text: string;
  createdAt: number;
  done: boolean;
  /** When it was checked off, so completed work can still show a time. */
  doneAt: number | null;
  replies: Reply[];
  /** Set when this item was split out of another item's thread. */
  parentId: string | null;
}

export type Filter = 'all' | 'open' | 'done';

export interface AppState {
  version: 1;
  items: Item[];
}
