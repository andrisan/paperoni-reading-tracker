import { useMemo, useState, type ReactNode } from 'react';
import { Archive, BookOpen, ChevronDown, Filter, Focus, Play, SquarePlus, X } from 'lucide-react';
import { useReadingTracker } from '../state/store';

function IconButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative group">
      <button
        className={`h-7 w-7 rounded-md transition-colors duration-150 flex items-center justify-center ${
          active
            ? 'text-accent bg-bg-hover'
            : 'text-text-tertiary hover:bg-bg-hover hover:text-text-primary'
        } disabled:opacity-50 disabled:pointer-events-none`}
        onClick={onClick}
        aria-label={label}
        disabled={disabled}
      >
        {children}
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 rounded-md border border-border-light bg-bg px-2 py-1 text-[11px] text-text-primary whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-75 z-20"
      >
        {label}
      </div>
    </div>
  );
}

function PillButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className="h-7 px-3 rounded-2xl border border-border bg-bg text-text-primary hover:border-accent/60 hover:bg-bg-hover transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function MenuSurface({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-0 top-full mt-1.5 min-w-[170px] rounded-xl border border-border-light bg-bg shadow-md p-1 z-30">
      {children}
    </div>
  );
}

function MenuRow({
  label,
  selected = false,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-colors duration-150 ${
        selected
          ? 'bg-bg-selected text-accent'
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function ReadingTrackerExtensionReservedArea() {
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [tagSearchValue, setTagSearchValue] = useState('');
  const {
    state,
    stats,
    ensureInitialized,
    toggleSession,
    toggleFocusMode,
    setBoardView,
    addTagFilter,
    removeTagFilter,
    clearTagFilters,
    archiveDoneItems,
    paperCatalog,
    addPaperFromCatalog,
    isPaperTracked,
    isPaperArchivedInTracker,
  } = useReadingTracker();

  const isBusy = state.status === 'loading';
  const isReady = state.status === 'ready';

  const closeMenus = () => {
    setBoardMenuOpen(false);
    setFilterMenuOpen(false);
    setArchiveOpen(false);
  };

  const boardViewLabel = state.boardView === 'board' ? 'Board' : 'List';
  const filterLabel =
    state.activeTagFilters.length > 0 ? `Tags (${state.activeTagFilters.length})` : 'Tag Filter';
  const quickAddQuery = quickAddValue.trim().toLowerCase();
  const normalizedTagSearch = tagSearchValue.trim().toLowerCase();
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const item of state.items) {
      if (item.isArchived) continue;
      for (const tag of item.tags) tagSet.add(tag);
    }
    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }, [state.items]);
  const tagSuggestions = useMemo(() => {
    const activeTags = new Set(state.activeTagFilters.map((tag) => tag.toLowerCase()));
    return availableTags
      .filter((tag) => !activeTags.has(tag.toLowerCase()))
      .filter((tag) => normalizedTagSearch.length === 0 || tag.toLowerCase().includes(normalizedTagSearch))
      .slice(0, 12);
  }, [availableTags, normalizedTagSearch, state.activeTagFilters]);
  const quickAddCandidates = quickAddQuery.length === 0
    ? paperCatalog.slice(0, 8)
    : paperCatalog
        .filter((paper) => {
          const haystack = [
            paper.title,
            paper.venue,
            ...paper.authors,
            ...paper.tags,
            paper.doi ?? '',
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(quickAddQuery);
        })
        .slice(0, 8);

  return (
    <div className="flex items-center gap-2">
      <IconButton
        label={state.sessionRunning ? 'Stop Reading Session' : 'Start Reading Session'}
        active={state.sessionRunning}
        disabled={isBusy}
        onClick={() => {
          closeMenus();
          toggleSession();
        }}
      >
        <Play size={15} />
      </IconButton>

      <div className="relative">
        <PillButton
          label="View"
          disabled={isBusy}
          onClick={() => {
            setBoardMenuOpen((prev) => !prev);
            setFilterMenuOpen(false);
            setArchiveOpen(false);
          }}
        >
          <BookOpen size={15} className="text-blue-500" />
          <span className="text-[12px] font-medium">{boardViewLabel}</span>
          <ChevronDown size={14} className="text-text-tertiary" />
        </PillButton>
        {boardMenuOpen && (
          <MenuSurface>
            <MenuRow
              label="Board View"
              selected={state.boardView === 'board'}
              onClick={() => {
                setBoardView('board');
                setBoardMenuOpen(false);
              }}
            />
            <MenuRow
              label="List View"
              selected={state.boardView === 'list'}
              onClick={() => {
                setBoardView('list');
                setBoardMenuOpen(false);
              }}
            />
          </MenuSurface>
        )}
      </div>

      <div className="relative">
        <PillButton
          label="Filter by Tags"
          disabled={isBusy}
          onClick={() => {
            setFilterMenuOpen((prev) => !prev);
            setBoardMenuOpen(false);
            setArchiveOpen(false);
          }}
        >
          <Filter size={14} className="text-text-primary" />
          <span className="text-[12px] font-medium">{filterLabel}</span>
          <ChevronDown size={14} className="text-text-tertiary" />
        </PillButton>
        {filterMenuOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-[280px] rounded-xl border border-border-light bg-bg shadow-md p-2 z-30">
            <div className="px-1 pb-1 text-[11px] font-medium text-text-primary">
              Filter papers by tags
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-border-light bg-bg-secondary px-2 h-8">
              <Filter size={12} className="text-text-tertiary shrink-0" />
              <input
                autoFocus
                value={tagSearchValue}
                onChange={(e) => setTagSearchValue(e.target.value)}
                placeholder="Search available tags..."
                className="w-full bg-transparent text-[12px] text-text-primary outline-none placeholder:text-text-tertiary"
                disabled={isBusy}
                aria-label="Search available tags"
              />
              {tagSearchValue.trim() && (
                <button
                  type="button"
                  className="text-text-tertiary hover:text-text-primary"
                  onClick={() => setTagSearchValue('')}
                  aria-label="Clear tag search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="mt-2 max-h-36 overflow-y-auto rounded-md border border-border-light bg-bg-secondary">
              {tagSuggestions.length === 0 ? (
                <div className="px-2.5 py-2 text-[11px] text-text-tertiary">
                  {availableTags.length === 0 ? 'No tags available yet' : 'No matching tags'}
                </div>
              ) : (
                tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="w-full text-left px-2.5 py-1.5 text-[12px] text-text-secondary hover:bg-bg-hover hover:text-text-primary border-b last:border-b-0 border-border-light"
                    onClick={() => {
                      addTagFilter(tag);
                      setTagSearchValue('');
                    }}
                  >
                    {tag}
                  </button>
                ))
              )}
            </div>
            <div className="mt-2">
              <div className="px-1 pb-1 text-[11px] text-text-tertiary">Active tags</div>
              {state.activeTagFilters.length === 0 ? (
                <div className="px-2 py-1.5 text-[11px] text-text-tertiary rounded-md border border-dashed border-border-light">
                  No active tag filters
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {state.activeTagFilters.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border-light bg-bg-secondary text-[11px] text-text-primary hover:bg-bg-hover"
                      onClick={() => removeTagFilter(tag)}
                      title={`Remove tag filter ${tag}`}
                    >
                      <span>{tag}</span>
                      <X size={11} className="text-text-tertiary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-end gap-1">
              <button
                type="button"
                className="px-2.5 py-1 rounded-md text-[11px] text-text-secondary hover:bg-bg-hover disabled:opacity-50"
                disabled={state.activeTagFilters.length === 0}
                onClick={() => clearTagFilters()}
              >
                Clear All
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md text-[11px] text-text-secondary hover:bg-bg-hover"
                onClick={() => setFilterMenuOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <IconButton
        label={state.focusMode ? 'Disable Focus Mode' : 'Enable Focus Mode'}
        active={state.focusMode}
        disabled={isBusy}
        onClick={() => {
          closeMenus();
          toggleFocusMode();
        }}
      >
        <Focus size={15} />
      </IconButton>

      <IconButton
        label="Quick Add Paper"
        active={quickAddOpen}
        disabled={isBusy}
        onClick={() => {
          closeMenus();
          setQuickAddOpen((prev) => !prev);
        }}
      >
        <SquarePlus size={15} />
      </IconButton>

      <div className="relative">
        <IconButton
          label="Archive Completed"
          active={archiveOpen}
          disabled={isBusy}
          onClick={() => {
            setArchiveOpen((prev) => !prev);
            setBoardMenuOpen(false);
            setFilterMenuOpen(false);
          }}
        >
          <Archive size={15} />
        </IconButton>
        {archiveOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-[260px] rounded-xl border border-border-light bg-bg shadow-md p-2 z-30">
            <div className="text-[12px] font-medium text-text-primary px-1 pb-1">Archive completed papers?</div>
            <div className="text-[11px] text-text-tertiary px-1 pb-2">
              Archive done items from the board. Use the Archive page for restore/delete management.
            </div>
            <div className="text-[11px] text-text-tertiary px-1 pb-2">
              Tip: open the Archive activity from the Reading Tracker page.
            </div>
            <div className="flex items-center justify-end gap-1">
              <button
                className="px-2.5 py-1 rounded-md text-[11px] text-text-secondary hover:bg-bg-hover"
                onClick={() => setArchiveOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-2.5 py-1 rounded-md text-[11px] bg-bg-tertiary text-text-primary hover:bg-bg-hover disabled:opacity-50"
                disabled={!isReady}
                onClick={() => {
                  archiveDoneItems();
                  setArchiveOpen(false);
                }}
              >
                Archive Done
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-7 px-1 flex items-center gap-2 text-[12px] font-medium">
        <span className="text-text-tertiary">To Read {stats.backlog}</span>
        <span className="text-amber-600 dark:text-amber-400">Reading {stats.reading}</span>
        <span className="text-emerald-600 dark:text-emerald-400">Done {stats.done}</span>
      </div>

      {state.status === 'error' && (
        <button
          className="h-7 px-2 rounded-md text-[11px] border border-red-300/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={() => void ensureInitialized()}
        >
          Retry Load
        </button>
      )}

      {quickAddOpen && (
        <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-[320px] rounded-xl border border-border-light bg-bg shadow-lg p-3 z-40">
          <div className="text-[12px] font-semibold text-text-primary">Quick Add Paper</div>
          <div className="text-[11px] text-text-tertiary mt-0.5">
            Search and pick from your Paperoni paper list
          </div>
          <input
            autoFocus
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            placeholder="Search title, author, venue, tag..."
            className="mt-2 w-full h-8 rounded-md border border-border bg-bg-secondary px-2 text-[12px] text-text-primary outline-none focus:border-accent/70"
            disabled={isBusy}
          />
          <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border-light bg-bg-secondary">
            {quickAddCandidates.length === 0 ? (
              <div className="px-2.5 py-2 text-[11px] text-text-tertiary">No matching papers</div>
            ) : (
              quickAddCandidates.map((paper) => {
                const tracked = isPaperTracked(paper.id);
                const archived = isPaperArchivedInTracker(paper.id);
                const blocked = tracked && !archived;
                return (
                  <button
                    key={paper.id}
                    className="w-full text-left px-2.5 py-2 border-b last:border-b-0 border-border-light hover:bg-bg-hover disabled:opacity-50 disabled:cursor-default"
                    disabled={blocked || !isReady}
                    onClick={() => {
                      const result = addPaperFromCatalog(paper.id);
                      if (result === 'added' || result === 'restored') {
                        setQuickAddValue('');
                        setQuickAddOpen(false);
                      }
                    }}
                  >
                    <div className="text-[12px] text-text-primary line-clamp-1">{paper.title}</div>
                    <div className="mt-0.5 text-[11px] text-text-tertiary line-clamp-1">
                      {paper.authors.length > 0 ? paper.authors[0] : 'Unknown'}
                      {paper.authors.length > 1 ? ' et al.' : ''} · {paper.year}
                      {paper.venue ? ` · ${paper.venue}` : ''}
                    </div>
                    {blocked && (
                      <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        Already in Reading Tracker
                      </div>
                    )}
                    {archived && (
                      <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                        Archived in Reading Tracker (click to restore)
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1">
            <button
              className="px-2.5 py-1 rounded-md text-[11px] text-text-secondary hover:bg-bg-hover"
              onClick={() => setQuickAddOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
