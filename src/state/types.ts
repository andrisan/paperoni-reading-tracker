export const READING_TRACKER_ACTIVITY_SCOPED_ID = 'paperoni.reading-tracker:tracker';
export type ReadingTrackerPage = 'tracker' | 'archive';

export type ReadingTrackerStatus = 'backlog' | 'reading' | 'done';

export type ReadingTrackerBoardView = 'board' | 'list';

export interface ReadingTrackerItem {
  id: string;
  sourcePaperId?: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  tags: string[];
  doi?: string;
  url?: string;
  status: ReadingTrackerStatus;
  lastOpenedAt?: string;
  isArchived: boolean;
}

export interface ReadingTrackerState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  initialized: boolean;
  items: ReadingTrackerItem[];
  page: ReadingTrackerPage;
  sessionRunning: boolean;
  focusMode: boolean;
  boardView: ReadingTrackerBoardView;
  activeTagFilters: string[];
  errorMessage: string | null;
}
