import { useMemo } from 'react';
import { CheckCheck, BookOpen, Inbox, ArrowRight, RotateCcw, Check, Archive, Filter, X } from 'lucide-react';
import { useReadingTracker } from '../state/store';
import type { ReadingTrackerItem, ReadingTrackerStatus } from '../state/types';
import ArchiveView from './ArchiveView';

interface Column {
  id: ReadingTrackerStatus;
  label: string;
  description: string;
  icon: typeof Inbox;
  headerClass: string;
  badgeClass: string;
}

const COLUMNS: Column[] = [
  {
    id: 'backlog',
    label: 'To Read',
    description: 'Papers waiting to be started',
    icon: Inbox,
    headerClass: 'text-text-secondary',
    badgeClass: 'bg-bg-tertiary text-text-tertiary',
  },
  {
    id: 'reading',
    label: 'In Progress',
    description: 'Opened but not yet marked as done',
    icon: BookOpen,
    headerClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  {
    id: 'done',
    label: 'Done',
    description: 'Papers marked as read',
    icon: CheckCheck,
    headerClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
];

function BoardCard({
  item,
  columnId,
  onOpenDetail,
  onMarkReading,
  onMarkDone,
  onMoveBack,
}: {
  item: ReadingTrackerItem;
  columnId: Column['id'];
  onOpenDetail: (item: ReadingTrackerItem) => void;
  onMarkReading: (id: string) => void;
  onMarkDone: (id: string) => void;
  onMoveBack: (id: string) => void;
}) {
  const canOpenDetail = Boolean(item.sourcePaperId);
  const authorLine =
    item.authors.length === 0 ? 'Unknown' :
    item.authors.length === 1 ? item.authors[0] :
    `${item.authors[0]} et al.`;

  return (
    <div
      className={`group bg-bg rounded-lg border border-border-light p-3 flex flex-col gap-2 hover:border-border hover:shadow-sm transition-all duration-150 ${
        canOpenDetail ? 'cursor-pointer' : ''
      }`}
      onClick={() => {
        if (canOpenDetail) {
          onOpenDetail(item);
        }
      }}
      title={canOpenDetail ? 'Open paper details' : 'Paper details unavailable for this item'}
    >
      <div className="text-[13px] font-medium text-text-primary leading-snug line-clamp-2">
        {item.title}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
        <span className="truncate">{authorLine}</span>
        <span className="shrink-0">·</span>
        <span className="shrink-0">{item.year}</span>
        {item.venue && (
          <>
            <span className="shrink-0">·</span>
            <span className="truncate">{item.venue}</span>
          </>
        )}
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-bg-tertiary text-[10px] text-text-secondary">
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="px-1.5 py-0.5 rounded bg-bg-tertiary text-[10px] text-text-tertiary">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div
        className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {columnId === 'backlog' && (
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            onClick={() => onMarkReading(item.id)}
            title="Start reading"
          >
            <ArrowRight size={12} />
            Start Reading
          </button>
        )}
        {columnId === 'reading' && (
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors"
            onClick={() => onMarkDone(item.id)}
            title="Mark as done"
          >
            <Check size={12} />
            Mark as Done
          </button>
        )}
        {columnId === 'done' && (
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            onClick={() => onMoveBack(item.id)}
            title="Mark as unread"
          >
            <RotateCcw size={12} />
            Move Back
          </button>
        )}
      </div>
    </div>
  );
}

function BoardColumn({
  column,
  items,
  onOpenDetail,
  onMarkReading,
  onMarkDone,
  onMoveBack,
}: {
  column: Column;
  items: ReadingTrackerItem[];
  onOpenDetail: (item: ReadingTrackerItem) => void;
  onMarkReading: (id: string) => void;
  onMarkDone: (id: string) => void;
  onMoveBack: (id: string) => void;
}) {
  const Icon = column.icon;
  return (
    <div className="flex flex-col min-w-[200px] w-full flex-1">
      <div className="flex items-center gap-2 px-1 mb-1">
        <Icon size={15} className={column.headerClass} />
        <span className={`text-[13px] font-semibold ${column.headerClass}`}>{column.label}</span>
        <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${column.badgeClass}`}>
          {items.length}
        </span>
      </div>
      <div className="px-1 mb-3 text-[11px] text-text-tertiary">{column.description}</div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
        {items.length === 0 ? (
          <div className="text-[12px] text-text-tertiary text-center py-8 italic">No papers here</div>
        ) : (
          items.map((item) => (
            <BoardCard
              key={item.id}
              item={item}
              columnId={column.id}
              onOpenDetail={onOpenDetail}
              onMarkReading={onMarkReading}
              onMarkDone={onMarkDone}
              onMoveBack={onMoveBack}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function ReadingTrackerView({ openPaperDetail }: { openPaperDetail: (paperId: string) => void }) {
  const {
    state,
    stats,
    columns,
    archivedItems,
    ensureInitialized,
    setPage,
    removeTagFilter,
    clearTagFilters,
    markItemReading,
    markItemDone,
    markItemBacklog,
  } = useReadingTracker();

  const columnData = useMemo(
    () => COLUMNS.map((column) => ({ column, items: columns[column.id] })),
    [columns],
  );
  const handleOpenTrackerItemDetail = (item: ReadingTrackerItem) => {
    if (!item.sourcePaperId) return;
    openPaperDetail(item.sourcePaperId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {state.page === 'archive' ? <ArchiveView openPaperDetail={openPaperDetail} /> : null}
      {state.page === 'archive' ? null : (
      <>
      <div className="px-6 py-4 border-b border-border-light shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[16px] font-semibold text-text-primary">Reading Tracker</h1>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              {state.status === 'ready'
                ? `Track your reading progress across ${stats.total} papers`
                : 'Track your reading progress'}
            </p>
          </div>
          {archivedItems.length > 0 ? (
            <button
              className="shrink-0 px-3 py-1.5 rounded-md text-[12px] border border-border text-text-primary hover:bg-bg-hover inline-flex items-center gap-1.5"
              onClick={() => setPage('archive')}
            >
              <Archive size={13} className="text-text-tertiary" />
              Archived Papers ({archivedItems.length})
            </button>
          ) : null}
        </div>
        {state.activeTagFilters.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-light bg-bg text-[11px] text-text-secondary">
              <Filter size={12} className="text-text-tertiary" />
              <span>Tag filters active</span>
              <button
                type="button"
                className="text-text-tertiary hover:text-text-primary"
                onClick={() => clearTagFilters()}
                aria-label="Clear all tag filters"
                title="Clear all tag filters"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {state.activeTagFilters.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border-light bg-bg text-[11px] text-text-primary hover:bg-bg-hover"
                  onClick={() => removeTagFilter(tag)}
                  aria-label={`Remove tag filter ${tag}`}
                  title={`Remove tag filter ${tag}`}
                >
                  <span>{tag}</span>
                  <X size={11} className="text-text-tertiary" />
                </button>
              ))}
            </div>
            <span className="text-[11px] text-text-tertiary">
              {columns.backlog.length + columns.reading.length + columns.done.length} match
              {columns.backlog.length + columns.reading.length + columns.done.length === 1 ? '' : 'es'}
            </span>
          </div>
        )}
      </div>

      {state.status === 'loading' || (state.status === 'idle' && !state.initialized) ? (
        <div className="flex-1 flex items-center justify-center text-[13px] text-text-tertiary">
          Loading reading tracker...
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="rounded-lg border border-border-light bg-bg p-4 max-w-sm w-full">
            <div className="text-[13px] font-medium text-text-primary">Failed to load Reading Tracker</div>
            <div className="mt-1 text-[12px] text-text-tertiary">
              {state.errorMessage ?? 'Unknown error'}
            </div>
            <button
              className="mt-3 px-3 py-1.5 rounded-md text-[12px] bg-accent text-white hover:bg-accent-hover"
              onClick={() => void ensureInitialized()}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {state.status === 'ready' && state.boardView === 'list' ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-[13px] font-medium text-text-primary">List view coming soon</div>
            <div className="text-[12px] text-text-tertiary mt-1">
              Your reading tracker data is loaded. Switch back to Board view to manage items.
            </div>
          </div>
        </div>
      ) : null}

      {state.status === 'ready' && state.boardView === 'board' ? (
        <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden px-6 py-5 min-h-0">
          {columnData.map(({ column, items }) => (
            <BoardColumn
              key={column.id}
              column={column}
              items={items}
              onOpenDetail={handleOpenTrackerItemDetail}
              onMarkReading={markItemReading}
              onMarkDone={markItemDone}
              onMoveBack={markItemBacklog}
            />
          ))}
        </div>
      ) : null}
      </>
      )}
    </div>
  );
}
