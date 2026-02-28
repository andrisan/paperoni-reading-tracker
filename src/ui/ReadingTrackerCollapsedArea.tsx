import { useMemo, useState } from 'react';
import {
  Archive,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Filter,
  Focus,
  Play,
  SquarePlus,
  X,
} from 'lucide-react';
import { useReadingTracker } from '../state/store';

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

export default function ReadingTrackerCollapsedArea() {
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

  const boardViewLabel = state.boardView === 'board' ? 'Board' : 'List';
  const filterLabel =
    state.activeTagFilters.length > 0 ? `Tags (${state.activeTagFilters.length})` : 'Tag Filter';
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
      .slice(0, 10);
  }, [availableTags, normalizedTagSearch, state.activeTagFilters]);
  const quickAddQuery = quickAddValue.trim().toLowerCase();
  const quickAddCandidates =
    quickAddQuery.length === 0
      ? paperCatalog.slice(0, 8)
      : paperCatalog
          .filter((paper) => {
            const haystack = [paper.title, paper.venue, ...paper.authors, ...paper.tags, paper.doi ?? '']
              .join(' ')
              .toLowerCase();
            return haystack.includes(quickAddQuery);
          })
          .slice(0, 8);

  const rowBase =
    'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none';

  return (
    <div className="w-[220px] p-1">
      {/* Session */}
      <button
        className={`${rowBase} ${
          state.sessionRunning
            ? 'text-accent hover:bg-bg-hover'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
        disabled={isBusy}
        onClick={toggleSession}
      >
        <Play size={13} />
        {state.sessionRunning ? 'Stop Session' : 'Start Session'}
        {state.sessionRunning && (
          <span className="ml-auto text-[10px] font-medium text-accent">Active</span>
        )}
      </button>

      {/* Board view */}
      <button
        className={`${rowBase} text-text-secondary hover:bg-bg-hover hover:text-text-primary`}
        disabled={isBusy}
        onClick={() => { setBoardMenuOpen((p) => !p); setFilterMenuOpen(false); }}
      >
        <BookOpen size={13} className="text-blue-500" />
        <span>View: {boardViewLabel}</span>
        {boardMenuOpen
          ? <ChevronDown size={12} className="ml-auto text-text-tertiary" />
          : <ChevronRight size={12} className="ml-auto text-text-tertiary" />
        }
      </button>
      {boardMenuOpen && (
        <div className="mx-2 mb-1 rounded-lg border border-border-light bg-bg-secondary p-1">
          <MenuRow
            label="Board View"
            selected={state.boardView === 'board'}
            onClick={() => { setBoardView('board'); setBoardMenuOpen(false); }}
          />
          <MenuRow
            label="List View"
            selected={state.boardView === 'list'}
            onClick={() => { setBoardView('list'); setBoardMenuOpen(false); }}
          />
        </div>
      )}

      {/* Tag filter */}
      <button
        className={`${rowBase} text-text-secondary hover:bg-bg-hover hover:text-text-primary`}
        disabled={isBusy}
        onClick={() => { setFilterMenuOpen((p) => !p); setBoardMenuOpen(false); }}
      >
        <Filter size={13} />
        <span>Filter: {filterLabel}</span>
        {filterMenuOpen
          ? <ChevronDown size={12} className="ml-auto text-text-tertiary" />
          : <ChevronRight size={12} className="ml-auto text-text-tertiary" />
        }
      </button>
      {filterMenuOpen && (
        <div className="mx-2 mb-1 rounded-lg border border-border-light bg-bg-secondary p-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border-light bg-bg px-2 h-7">
            <Filter size={11} className="text-text-tertiary shrink-0" />
            <input
              autoFocus
              value={tagSearchValue}
              onChange={(e) => setTagSearchValue(e.target.value)}
              placeholder="Search tags..."
              className="w-full bg-transparent text-[11px] text-text-primary outline-none placeholder:text-text-tertiary"
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
                <X size={11} />
              </button>
            )}
          </div>

          <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-border-light bg-bg">
            {tagSuggestions.length === 0 ? (
              <div className="px-2 py-1.5 text-[10px] text-text-tertiary">
                {availableTags.length === 0 ? 'No tags available yet' : 'No matching tags'}
              </div>
            ) : (
              tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-[11px] text-text-secondary hover:bg-bg-hover hover:text-text-primary border-b last:border-b-0 border-border-light"
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

          <div className="mt-1 flex flex-wrap gap-1">
            {state.activeTagFilters.length === 0 ? (
              <div className="w-full px-2 py-1 text-[10px] text-text-tertiary rounded border border-dashed border-border-light">
                No active tags
              </div>
            ) : (
              state.activeTagFilters.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border-light bg-bg text-[10px] text-text-primary hover:bg-bg-hover"
                  onClick={() => removeTagFilter(tag)}
                >
                  <span>{tag}</span>
                  <X size={10} className="text-text-tertiary" />
                </button>
              ))
            )}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1">
            <button
              type="button"
              className="px-2 py-0.5 rounded text-[10px] text-text-secondary hover:bg-bg-hover disabled:opacity-50"
              disabled={state.activeTagFilters.length === 0}
              onClick={() => clearTagFilters()}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Focus mode */}
      <button
        className={`${rowBase} ${
          state.focusMode
            ? 'text-accent hover:bg-bg-hover'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
        disabled={isBusy}
        onClick={toggleFocusMode}
      >
        <Focus size={13} />
        Focus Mode
        {state.focusMode && (
          <span className="ml-auto text-[10px] font-medium text-accent">On</span>
        )}
      </button>

      {/* Quick Add */}
      <button
        className={`${rowBase} ${
          quickAddOpen
            ? 'text-accent hover:bg-bg-hover'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
        disabled={isBusy}
        onClick={() => { setQuickAddOpen((p) => !p); setArchiveOpen(false); setFilterMenuOpen(false); }}
      >
        <SquarePlus size={13} />
        Quick Add Paper
        {quickAddOpen
          ? <ChevronDown size={12} className="ml-auto text-text-tertiary" />
          : <ChevronRight size={12} className="ml-auto text-text-tertiary" />
        }
      </button>
      {quickAddOpen && (
        <div className="mx-2 mb-1">
          <input
            autoFocus
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            placeholder="Search title, author, venue…"
            className="mt-1 w-full h-7 rounded-md border border-border bg-bg-secondary px-2 text-[11px] text-text-primary outline-none focus:border-accent/70"
          />
          <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border-light bg-bg-secondary">
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
                    <div className="text-[11px] text-text-primary line-clamp-1">{paper.title}</div>
                    <div className="mt-0.5 text-[10px] text-text-tertiary line-clamp-1">
                      {paper.authors.length > 0 ? paper.authors[0] : 'Unknown'}
                      {paper.authors.length > 1 ? ' et al.' : ''} · {paper.year}
                    </div>
                    {blocked && (
                      <div className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                        Already tracked
                      </div>
                    )}
                    {archived && (
                      <div className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                        Archived (click to restore)
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Archive */}
      <button
        className={`${rowBase} ${
          archiveOpen
            ? 'text-accent hover:bg-bg-hover'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
        disabled={isBusy}
        onClick={() => { setArchiveOpen((p) => !p); setQuickAddOpen(false); setFilterMenuOpen(false); }}
      >
        <Archive size={13} />
        Archive Completed
        {archiveOpen
          ? <ChevronDown size={12} className="ml-auto text-text-tertiary" />
          : <ChevronRight size={12} className="ml-auto text-text-tertiary" />
        }
      </button>
      {archiveOpen && (
        <div className="mx-2 mb-1 p-2 rounded-lg border border-border-light bg-bg-secondary">
          <div className="text-[11px] text-text-tertiary mb-2">
            Archive all done papers from the board?
          </div>
          <div className="flex items-center justify-end gap-1">
            <button
              className="px-2 py-0.5 rounded text-[11px] text-text-secondary hover:bg-bg-hover"
              onClick={() => setArchiveOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-2 py-0.5 rounded text-[11px] bg-bg-tertiary text-text-primary hover:bg-bg-hover disabled:opacity-50"
              disabled={!isReady}
              onClick={() => { archiveDoneItems(); setArchiveOpen(false); }}
            >
              Archive Done
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-1 pt-2 border-t border-border-light px-2.5 flex items-center gap-2 text-[11px] font-medium">
        <span className="text-text-tertiary">To Read {stats.backlog}</span>
        <span className="text-amber-600 dark:text-amber-400">Reading {stats.reading}</span>
        <span className="text-emerald-600 dark:text-emerald-400">Done {stats.done}</span>
      </div>

      {/* Error retry */}
      {state.status === 'error' && (
        <div className="px-2 pt-1">
          <button
            className="w-full px-2 py-1 rounded-md text-[11px] border border-red-300/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={() => void ensureInitialized()}
          >
            Retry Load
          </button>
        </div>
      )}
    </div>
  );
}
