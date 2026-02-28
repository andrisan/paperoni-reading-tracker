import { useMemo, useState } from 'react';
import { Archive, ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';
import { useReadingTracker } from '../state/store';

export default function ArchiveView({ openPaperDetail }: { openPaperDetail: (paperId: string) => void }) {
  const [query, setQuery] = useState('');
  const handleOpenDetail = (sourcePaperId: string | undefined) => {
    if (!sourcePaperId) return;
    openPaperDetail(sourcePaperId);
  };
  const { state, archivedItems, ensureInitialized, restoreItem, deleteItem, setPage } = useReadingTracker();

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (normalizedQuery.length === 0) return archivedItems;
    return archivedItems.filter((item) =>
      [item.title, item.venue, ...item.authors, ...item.tags, item.doi ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [archivedItems, normalizedQuery]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border-light shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[16px] font-semibold text-text-primary">Archived Papers</h1>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              Restore or permanently delete papers archived from Reading Tracker
            </p>
          </div>
          <button
            className="shrink-0 px-3 py-1.5 rounded-md text-[12px] border border-border text-text-primary hover:bg-bg-hover inline-flex items-center gap-1.5"
            onClick={() => setPage('tracker')}
          >
            <ArrowLeft size={13} className="text-text-tertiary" />
            Back to Board
          </button>
        </div>
      </div>

      {state.status === 'loading' || (state.status === 'idle' && !state.initialized) ? (
        <div className="flex-1 flex items-center justify-center text-[13px] text-text-tertiary">
          Loading archive...
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

      {state.status === 'ready' ? (
        <div className="flex-1 overflow-hidden px-6 py-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search archived papers..."
                className="w-full h-9 rounded-md border border-border bg-bg px-3 text-[12px] text-text-primary outline-none focus:border-accent/70"
              />
            </div>
            <div className="text-[12px] text-text-tertiary">
              {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
            </div>
          </div>

          {archivedItems.length === 0 ? (
            <div className="flex-1 rounded-lg border border-dashed border-border-light bg-bg flex items-center justify-center text-[13px] text-text-tertiary">
              No archived papers yet
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex-1 rounded-lg border border-dashed border-border-light bg-bg flex items-center justify-center text-[13px] text-text-tertiary">
              No archived papers match your search
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto rounded-lg border border-border-light bg-bg">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 border-b last:border-b-0 border-border-light flex items-start gap-3 ${item.sourcePaperId ? 'cursor-pointer hover:bg-bg-hover' : ''}`}
                  onClick={() => handleOpenDetail(item.sourcePaperId)}
                  title={item.sourcePaperId ? 'Open paper details' : undefined}
                >
                  <div className="mt-0.5 shrink-0">
                    <Archive size={14} className="text-text-tertiary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-text-primary line-clamp-1">{item.title}</div>
                    <div className="mt-0.5 text-[11px] text-text-tertiary line-clamp-1">
                      {item.authors.length > 0 ? item.authors[0] : 'Unknown'}
                      {item.authors.length > 1 ? ' et al.' : ''} · {item.year}
                      {item.venue ? ` · ${item.venue}` : ''}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span
                            key={`${item.id}-${tag}`}
                            className="px-1.5 py-0.5 rounded bg-bg-tertiary text-[10px] text-text-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="px-2.5 py-1 rounded-md text-[11px] bg-bg-tertiary text-text-primary hover:bg-bg-hover flex items-center gap-1"
                      onClick={() => restoreItem(item.id)}
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                    <button
                      className="px-2.5 py-1 rounded-md text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
