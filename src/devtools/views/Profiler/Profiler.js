// @flow

import React, { Suspense, useCallback, useContext } from 'react';
import {
  CommitFilterModalContext,
  CommitFilterModalContextController,
} from './CommitFilterModalContext';
import { ProfilerContext } from './ProfilerContext';
import TabBar from '../TabBar';
import ClearProfilingDataButton from './ClearProfilingDataButton';
import CommitFlamegraph from './CommitFlamegraph';
import CommitRanked from './CommitRanked';
import FilterModal from './FilterModal';
import Interactions from './Interactions';
import RecordToggle from './RecordToggle';
import ReloadAndProfileButton from './ReloadAndProfileButton';
import ProfilingImportExportButtons from './ProfilingImportExportButtons';
import SnapshotSelector from './SnapshotSelector';
import SidebarCommitInfo from './SidebarCommitInfo';
import SidebarInteractions from './SidebarInteractions';
import SidebarSelectedFiberInfo from './SidebarSelectedFiberInfo';
import ToggleCommitFilterModalButton from './ToggleCommitFilterModalButton';
import portaledContent from '../portaledContent';

import styles from './Profiler.css';

export type Props = {|
  supportsProfiling: boolean,
|};

function Profiler({ supportsProfiling }: Props) {
  const { hasProfilingData, isProfiling, rootHasProfilingData } = useContext(
    ProfilerContext
  );

  if (isProfiling || !rootHasProfilingData) {
    return (
      <NonSuspendingProfiler
        hasProfilingData={hasProfilingData}
        isProfiling={isProfiling}
        supportsProfiling={supportsProfiling}
      />
    );
  } else {
    return (
      <CommitFilterModalContextController>
        <SuspendingProfiler />
      </CommitFilterModalContextController>
    );
  }
}

// This view is rendered when there is no profiler data (either we haven't profiled yet or we're currently profiling).
// Nothing in this view's subtree suspends.
// By not suspending while profiling is in progress, we avoid potential cache invalidation trickiness.
// NOTE that the structure of this UI should mirror SuspendingProfiler.
function NonSuspendingProfiler({
  hasProfilingData,
  isProfiling,
  supportsProfiling,
}: {|
  hasProfilingData: boolean,
  isProfiling: boolean,
  supportsProfiling: boolean,
|}) {
  let view = null;
  if (!supportsProfiling) {
    view = <ProfilingNotSupported />;
  } else if (isProfiling) {
    view = <RecortdingInProgress />;
  } else if (!hasProfilingData) {
    view = <NoProfilingData />;
  } else {
    view = <NoProfilingDataForRoot />;
  }

  return (
    <div className={styles.Profiler}>
      <div className={styles.LeftColumn}>
        <div className={styles.Toolbar}>
          <RecordToggle disabled={!supportsProfiling} />
          <ReloadAndProfileButton />
          <ClearProfilingDataButton />
          <ProfilingImportExportButtons />
          <div className={styles.VRule} />
          <TabBar
            currentTab={null}
            disabled
            id="Profiler"
            selectTab={() => {}}
            size="small"
            tabs={tabs}
          />
        </div>
        <div className={styles.Content}>{view}</div>
      </div>
    </div>
  );
}

function ContentFallback() {
  return <div className={styles.ContentFallback}>Loading...</div>;
}

function SnapshotSelectorFallback() {
  return <div className={styles.SnapshotSelectorFallback}>Loading...</div>;
}

// This view is rendered when there is profiler data (even though there may not be any for the currently selected root).
// This view's subtree uses suspense to request profiler data from the backend.
// NOTE that the structure of this UI should mirror NonSuspendingProfiler.
function SuspendingProfiler() {
  const { selectedFiberID, selectedTabID, selectTab } = useContext(
    ProfilerContext
  );
  const { isFilterModalShowing, setIsFilterModalShowing } = useContext(
    CommitFilterModalContext
  );

  const dismissFilterModal = useCallback(() => setIsFilterModalShowing(false), [
    setIsFilterModalShowing,
  ]);

  let view = null;
  switch (selectedTabID) {
    case 'flame-chart':
      view = <CommitFlamegraph />;
      break;
    case 'ranked-chart':
      view = <CommitRanked />;
      break;
    case 'interactions':
      view = <Interactions />;
      break;
    default:
      break;
  }

  let sidebar = null;
  switch (selectedTabID) {
    case 'interactions':
      sidebar = <SidebarInteractions />;
      break;
    case 'flame-chart':
    case 'ranked-chart':
      if (selectedFiberID !== null) {
        sidebar = <SidebarSelectedFiberInfo />;
      } else {
        sidebar = <SidebarCommitInfo />;
      }
      break;
    default:
      break;
  }

  return (
    <div className={styles.Profiler}>
      <div className={styles.LeftColumn}>
        <div className={styles.Toolbar}>
          <RecordToggle />
          <ReloadAndProfileButton />
          <ClearProfilingDataButton />
          <ProfilingImportExportButtons />
          <div className={styles.VRule} />
          <TabBar
            currentTab={selectedTabID}
            id="Profiler"
            selectTab={selectTab}
            size="small"
            tabs={tabs}
          />
          <div className={styles.Spacer} />
          <ToggleCommitFilterModalButton />
          <div className={styles.VRule} />
          <Suspense fallback={<SnapshotSelectorFallback />}>
            <SnapshotSelector />
          </Suspense>
        </div>
        <div className={styles.Content}>
          <Suspense fallback={<ContentFallback />}>{view}</Suspense>
          {isFilterModalShowing && (
            <FilterModal dismissModal={dismissFilterModal} />
          )}
        </div>
      </div>
      <div className={styles.RightColumn}>
        <Suspense fallback={<ContentFallback />}>{sidebar}</Suspense>
      </div>
    </div>
  );
}

const tabs = [
  {
    id: 'flame-chart',
    icon: 'flame-chart',
    label: 'Flamegraph',
    title: 'Flamegraph chart',
  },
  {
    id: 'ranked-chart',
    icon: 'ranked-chart',
    label: 'Ranked',
    title: 'Ranked chart',
  },
  {
    id: 'interactions',
    icon: 'interactions',
    label: 'Interactions',
    title: 'Profiled interactions',
  },
];

const NoProfilingData = () => (
  <div className={styles.Column}>
    <div className={styles.Header}>No profiling data has been recorded.</div>
    <div className={styles.Row}>
      Click the record button <RecordToggle /> to start recording.
    </div>
  </div>
);

const NoProfilingDataForRoot = () => (
  <div className={styles.Column}>
    <div className={styles.Header}>
      No profiling data has been recorded for the selected root.
    </div>
    <div className={styles.Row}>
      Select a different root in the elements panel, or click the record button{' '}
      <RecordToggle /> to start recording.
    </div>
  </div>
);

const ProfilingNotSupported = () => (
  <div className={styles.Column}>
    <div className={styles.Header}>Profiling not supported.</div>
    <div className={styles.Column}>
      <p>
        Profiling support requires either a development or production-profiling
        build of React v16.5+.
      </p>
      <p>
        Learn more at{' '}
        <a
          className={styles.Link}
          href="https://fb.me/react-profiling"
          rel="noopener noreferrer"
          target="_blank"
        >
          fb.me/react-profiling
        </a>
        .
      </p>
    </div>
  </div>
);

const RecortdingInProgress = () => (
  <div className={styles.Column}>
    <div className={styles.Header}>Profiling is in progress...</div>
    <div className={styles.Row}>
      Click the record button <RecordToggle /> to stop recording.
    </div>
  </div>
);

export default portaledContent(Profiler);
