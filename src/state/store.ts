import { useSyncExternalStore } from 'react';
import type { App, Paper } from 'paperoni';
import { DUMMY_READING_TRACKER_ITEMS } from './dummyData';
import type {
  ReadingTrackerBoardView,
  ReadingTrackerItem,
  ReadingTrackerPage,
  ReadingTrackerState,
  ReadingTrackerStatus,
} from './types';

type Listener = () => void;

const STORAGE_VERSION = 1;

const initialState: ReadingTrackerState = {
  status: 'idle',
  initialized: false,
  items: [],
  page: 'tracker',
  sessionRunning: false,
  focusMode: false,
  boardView: 'board',
  activeTagFilters: [],
  errorMessage: null,
};

function normalizeItem(item: unknown): ReadingTrackerItem | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  if (typeof raw.id !== 'string') return null;
  if (typeof raw.title !== 'string') return null;

  const status: ReadingTrackerStatus =
    raw.status === 'reading' || raw.status === 'done' ? raw.status : 'backlog';

  return {
    id: raw.id,
    sourcePaperId: typeof raw.sourcePaperId === 'string' ? raw.sourcePaperId : undefined,
    title: raw.title,
    authors: Array.isArray(raw.authors) ? raw.authors.map((author) => String(author)) : [],
    year: typeof raw.year === 'number' ? raw.year : 0,
    venue: typeof raw.venue === 'string' ? raw.venue : '',
    tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => String(tag)) : [],
    doi: typeof raw.doi === 'string' ? raw.doi : undefined,
    url: typeof raw.url === 'string' ? raw.url : undefined,
    status,
    lastOpenedAt: typeof raw.lastOpenedAt === 'string' ? raw.lastOpenedAt : undefined,
    isArchived: Boolean(raw.isArchived),
  };
}

function filterItems(
  items: ReadingTrackerItem[],
  activeTagFilters: string[],
): ReadingTrackerItem[] {
  const activeItems = items.filter((item) => !item.isArchived);
  const normalizedFilters = activeTagFilters
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  if (normalizedFilters.length === 0) return activeItems;
  return activeItems.filter((item) =>
    normalizedFilters.some((filterTag) =>
      item.tags.some((tag) => tag.toLowerCase() === filterTag),
    ),
  );
}

function countByStatus(items: ReadingTrackerItem[], status: ReadingTrackerStatus) {
  return items.filter((item) => !item.isArchived && item.status === status).length;
}

interface Snapshot {
  state: ReadingTrackerState;
  paperCatalog: Paper[];
}

class ReadingTrackerStore {
  private app: App | null = null;
  private snapshot: Snapshot = { state: initialState, paperCatalog: [] };
  private readonly listeners = new Set<Listener>();
  private initPromise: Promise<void> | null = null;
  private writeTimer: number | null = null;
  private loadFn: (() => Promise<unknown>) | null = null;
  private saveFn: ((data: unknown) => Promise<void>) | null = null;
  private quickAddCounter = 0;

  configure(options: {
    app: App;
    loadData: () => Promise<unknown>;
    saveData: (data: unknown) => Promise<void>;
  }) {
    this.app = options.app;
    this.loadFn = options.loadData;
    this.saveFn = options.saveData;
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private setState(nextState: ReadingTrackerState) {
    this.snapshot = { ...this.snapshot, state: nextState };
    this.emit();
  }

  private setPaperCatalog(papers: Paper[]) {
    this.snapshot = { ...this.snapshot, paperCatalog: papers };
    this.emit();
  }

  private schedulePersist() {
    if (!this.saveFn) return;
    if (this.writeTimer != null) {
      window.clearTimeout(this.writeTimer);
    }
    this.writeTimer = window.setTimeout(() => {
      this.writeTimer = null;
      const payload = {
        version: STORAGE_VERSION,
        items: this.snapshot.state.items,
      };
      void this.saveFn?.(payload);
    }, 120);
  }

  async ensureInitialized() {
    const { state } = this.snapshot;
    if (state.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.setState({ ...state, status: 'loading', errorMessage: null });

    this.initPromise = Promise.resolve()
      .then(async () => {
        const stored = await this.loadFn?.();
        const rawItems = (stored && typeof stored === 'object' && Array.isArray((stored as { items?: unknown[] }).items))
          ? (stored as { items: unknown[] }).items
          : [];

        const parsedItems = rawItems
          .map((item) => normalizeItem(item))
          .filter((item): item is ReadingTrackerItem => item !== null);

        const items = parsedItems.length > 0 ? parsedItems : [...DUMMY_READING_TRACKER_ITEMS];

        this.setState({
          ...this.snapshot.state,
          status: 'ready',
          initialized: true,
          items,
          errorMessage: null,
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load Reading Tracker data';
        this.setState({
          ...this.snapshot.state,
          status: 'error',
          errorMessage: message,
        });
      })
      .finally(() => {
        this.initPromise = null;
      });

    return this.initPromise;
  }

  async refreshPaperCatalog() {
    if (!this.app) return;
    const papers = await this.app.papers.list();
    this.setPaperCatalog(papers);
  }

  applyPaperSnapshot(papers: Paper[]) {
    this.setPaperCatalog(papers);
  }

  dispose() {
    if (this.writeTimer != null) {
      window.clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.listeners.clear();
  }

  private updateItems(nextItems: ReadingTrackerItem[]) {
    this.setState({
      ...this.snapshot.state,
      items: nextItems,
    });
    this.schedulePersist();
  }

  setPage = (page: ReadingTrackerPage) => {
    this.setState({ ...this.snapshot.state, page });
  };

  toggleSession = () => {
    this.setState({ ...this.snapshot.state, sessionRunning: !this.snapshot.state.sessionRunning });
  };

  toggleFocusMode = () => {
    this.setState({ ...this.snapshot.state, focusMode: !this.snapshot.state.focusMode });
  };

  setBoardView = (view: ReadingTrackerBoardView) => {
    this.setState({ ...this.snapshot.state, boardView: view });
  };

  addTagFilter = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) return;
    if (this.snapshot.state.activeTagFilters.some((entry) => entry.toLowerCase() === normalized)) {
      return;
    }
    this.setState({
      ...this.snapshot.state,
      activeTagFilters: [...this.snapshot.state.activeTagFilters, tag],
    });
  };

  removeTagFilter = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    this.setState({
      ...this.snapshot.state,
      activeTagFilters: this.snapshot.state.activeTagFilters.filter(
        (entry) => entry.toLowerCase() !== normalized,
      ),
    });
  };

  clearTagFilters = () => {
    if (this.snapshot.state.activeTagFilters.length === 0) return;
    this.setState({
      ...this.snapshot.state,
      activeTagFilters: [],
    });
  };

  markItemReading = (id: string) => {
    const now = new Date().toISOString();
    this.updateItems(this.snapshot.state.items.map((item) => (
      item.id === id
        ? { ...item, status: 'reading', lastOpenedAt: now }
        : item
    )));
  };

  markItemDone = (id: string) => {
    const now = new Date().toISOString();
    this.updateItems(this.snapshot.state.items.map((item) => (
      item.id === id
        ? { ...item, status: 'done', lastOpenedAt: item.lastOpenedAt ?? now }
        : item
    )));
  };

  markItemBacklog = (id: string) => {
    this.updateItems(this.snapshot.state.items.map((item) => (
      item.id === id
        ? { ...item, status: 'backlog' }
        : item
    )));
  };

  archiveDoneItems = () => {
    this.updateItems(this.snapshot.state.items.map((item) => (
      item.status === 'done' ? { ...item, isArchived: true } : item
    )));
  };

  restoreItem = (id: string) => {
    this.updateItems(this.snapshot.state.items.map((item) => (
      item.id === id ? { ...item, isArchived: false } : item
    )));
  };

  deleteItem = (id: string) => {
    this.updateItems(this.snapshot.state.items.filter((item) => item.id !== id));
  };

  addPaperFromCatalog = (paperId: string): 'added' | 'restored' | 'exists' | 'not_found' => {
    const existing = this.snapshot.state.items.find((item) => item.sourcePaperId === paperId);
    if (existing) {
      if (existing.isArchived) {
        this.restoreItem(existing.id);
        return 'restored';
      }
      return 'exists';
    }

    const paper = this.snapshot.paperCatalog.find((candidate) => candidate.id === paperId);
    if (!paper) return 'not_found';

    this.quickAddCounter += 1;
    const nextItem: ReadingTrackerItem = {
      id: `rt-quick-${Date.now()}-${this.quickAddCounter}`,
      sourcePaperId: paper.id,
      title: paper.title,
      authors: [...paper.authors],
      year: paper.year,
      venue: paper.venue,
      tags: [...paper.tags],
      doi: paper.doi,
      url: paper.url,
      status: 'backlog',
      isArchived: false,
    };

    this.updateItems([nextItem, ...this.snapshot.state.items]);
    return 'added';
  };

  isPaperTracked = (paperId: string) => {
    return this.snapshot.state.items.some((item) => item.sourcePaperId === paperId);
  };

  isPaperArchivedInTracker = (paperId: string) => {
    return this.snapshot.state.items.some((item) => item.sourcePaperId === paperId && item.isArchived);
  };

  selectors() {
    const { state } = this.snapshot;
    const visibleItems = filterItems(state.items, state.activeTagFilters);
    const archivedItems = state.items.filter((item) => item.isArchived);
    const columns = {
      backlog: visibleItems.filter((item) => item.status === 'backlog'),
      reading: visibleItems.filter((item) => item.status === 'reading'),
      done: visibleItems.filter((item) => item.status === 'done'),
    };

    const backlog = countByStatus(state.items, 'backlog');
    const reading = countByStatus(state.items, 'reading');
    const done = countByStatus(state.items, 'done');
    const total = backlog + reading + done;
    const completionPct = total === 0 ? 0 : Math.round((done / total) * 100);

    return {
      state,
      paperCatalog: this.snapshot.paperCatalog,
      visibleItems,
      archivedItems,
      columns,
      stats: {
        backlog,
        reading,
        done,
        total,
        completionPct,
      },
    };
  }
}

const store = new ReadingTrackerStore();

export function getReadingTrackerStore(): ReadingTrackerStore {
  return store;
}

export function useReadingTracker() {
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  const derived = store.selectors();

  return {
    ...derived,
    ensureInitialized: () => store.ensureInitialized(),
    setPage: store.setPage,
    toggleSession: store.toggleSession,
    toggleFocusMode: store.toggleFocusMode,
    setBoardView: store.setBoardView,
    addTagFilter: store.addTagFilter,
    removeTagFilter: store.removeTagFilter,
    clearTagFilters: store.clearTagFilters,
    markItemReading: store.markItemReading,
    markItemDone: store.markItemDone,
    markItemBacklog: store.markItemBacklog,
    archiveDoneItems: store.archiveDoneItems,
    restoreItem: store.restoreItem,
    deleteItem: store.deleteItem,
    addPaperFromCatalog: store.addPaperFromCatalog,
    isPaperTracked: store.isPaperTracked,
    isPaperArchivedInTracker: store.isPaperArchivedInTracker,
  };
}
