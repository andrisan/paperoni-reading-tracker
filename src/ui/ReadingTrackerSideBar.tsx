import { Inbox, BookOpen, CheckCheck } from 'lucide-react';
import { useReadingTracker } from '../state/store';

export default function ReadingTrackerSideBar() {
  const { state, stats } = useReadingTracker();

  if (state.status === 'loading' || (state.status === 'idle' && !state.initialized)) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          Reading Tracker
        </div>
        <div className="px-3 py-3 mx-3 rounded-lg bg-bg-tertiary text-[12px] text-text-tertiary">
          Loading reading tracker...
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          Reading Tracker
        </div>
        <div className="px-3 py-3 mx-3 rounded-lg bg-bg-tertiary text-[12px] text-red-500">
          {state.errorMessage ?? 'Failed to load Reading Tracker'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
        Reading Tracker
      </div>

      {/* Progress */}
      <div className="px-3 py-3 mx-3 mb-2 rounded-lg bg-bg-tertiary flex flex-col gap-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-secondary font-medium">Completion</span>
          <span className="text-text-primary font-semibold">{stats.completionPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${stats.completionPct}%` }}
          />
        </div>
        <div className="text-[11px] text-text-tertiary">
          {stats.done} of {stats.total} papers read
        </div>
      </div>

      {/* Column breakdown */}
      <nav className="px-3 flex flex-col gap-px">
        <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          Columns
        </div>

        <div className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] text-text-secondary">
          <Inbox size={16} className="text-text-tertiary shrink-0" />
          <span className="flex-1">To Read</span>
          <span className="text-[12px] font-semibold text-text-tertiary">{stats.backlog}</span>
        </div>

        <div className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] text-text-secondary">
          <BookOpen size={16} className="text-amber-500 shrink-0" />
          <span className="flex-1">In Progress</span>
          <span className="text-[12px] font-semibold text-amber-500">{stats.reading}</span>
        </div>

        <div className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] text-text-secondary">
          <CheckCheck size={16} className="text-emerald-500 shrink-0" />
          <span className="flex-1">Done</span>
          <span className="text-[12px] font-semibold text-emerald-500">{stats.done}</span>
        </div>
      </nav>

      <div className="flex-1" />
    </div>
  );
}
