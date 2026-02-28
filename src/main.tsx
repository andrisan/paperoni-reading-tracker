import manifest from '../manifest.json';
import { createRoot } from 'react-dom/client';
import { Extension, Toast } from 'paperoni';
import ReadingTrackerView from './ui/ReadingTrackerView';
import ReadingTrackerSideBar from './ui/ReadingTrackerSideBar';
import ReadingTrackerExtensionReservedArea from './ui/ReadingTrackerExtensionReservedArea';
import ReadingTrackerCollapsedArea from './ui/ReadingTrackerCollapsedArea';
import { getReadingTrackerStore } from './state/store';

export { manifest };

export default class ReadingTrackerExtension extends Extension {
  static manifest = manifest;

  async onload() {
    const store = getReadingTrackerStore();
    store.configure({
      app: this.app,
      loadData: () => this.loadData(),
      saveData: (data) => this.saveData(data),
    });

    await Promise.all([
      store.ensureInitialized(),
      store.refreshPaperCatalog(),
    ]);

    this.registerEvent(this.app.events.on('papers.changed', ({ snapshot }) => {
      store.applyPaperSnapshot(snapshot.papers);
    }));

    this.addActivity({
      id: 'tracker',
      label: 'Reading Tracker',
      icon: 'kanban-square',
      order: 10,
    });

    this.addActivityView('tracker', (el) => {
      const root = createRoot(el);
      root.render(
        <ReadingTrackerView
          openPaperDetail={(paperId) => {
            void this.app.ui.openPaperDetail(paperId);
          }}
        />,
      );
      return () => {
        root.unmount();
      };
    });

    this.addActivitySidebar('tracker', (el) => {
      const root = createRoot(el);
      root.render(<ReadingTrackerSideBar />);
      return () => {
        root.unmount();
      };
    });

    this.addTopbarControl({
      id: 'controls',
      activityId: 'tracker',
      order: 10,
      mount: (el) => {
        const root = createRoot(el);
        root.render(<ReadingTrackerExtensionReservedArea />);
        return () => {
          root.unmount();
        };
      },
      mountCollapsed: (el) => {
        const root = createRoot(el);
        root.render(<ReadingTrackerCollapsedArea />);
        return () => {
          root.unmount();
        };
      },
    });

    this.addCommand({
      id: 'reading-tracker-refresh',
      name: 'Reading Tracker: Refresh papers',
      callback: async () => {
        await store.refreshPaperCatalog();
        new Toast('Reading Tracker refreshed', { kind: 'success' });
      },
    });
  }

  onunload() {
    getReadingTrackerStore().dispose();
  }
}
