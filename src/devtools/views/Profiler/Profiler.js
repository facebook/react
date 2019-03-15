// @flow

import React, { Suspense, useCallback, useContext, useState } from 'react';
import { ProfilerContext } from './ProfilerContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import TabBar from '../TabBar';
import FilterModal from './FilterModal';
import RecordToggle from './RecordToggle';
import SnapshotSelector from './SnapshotSelector';

import styles from './Profiler.css';

export default function Profiler(_: {||}) {
  const { hasProfilingData, isProfiling } = useContext(ProfilerContext);

  if (isProfiling || !hasProfilingData) {
    return <NonSuspendingProfiler isProfiling={isProfiling} />;
  } else {
    return (
      <Suspense fallback={<ProfilerFallback />}>
        <SuspendingProfiler />
      </Suspense>
    );
  }
}

// This view is rendered when there is no profiler data (either we haven't profiled yet or we're currently profiling).
// Nothing in this view's subtree suspends.
// By not suspending while profiling is in progress, we avoid potential cache invalidation trickiness.
function NonSuspendingProfiler({ isProfiling }: {| isProfiling: boolean |}) {
  const view = isProfiling ? <RecortdingInProgress /> : <NoProfilingData />;

  return (
    <div className={styles.Profiler}>
      <div className={styles.LeftColumn}>
        <div className={styles.Toolbar}>
          <RecordToggle />
          <Button disabled title="Reload and start profiling">
            {/* TODO (profiling) Wire up reload button */}
            <ButtonIcon type="reload" />
          </Button>
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

// TODO (profiling) Real fallback UI
function ProfilerFallback() {
  return <div>Loading...</div>;
}

// This view is rendered when there is profiler data (even though there may not be any for the currently selected root).
// This view's subtree uses suspense to request profiler data from the backend.
function SuspendingProfiler(_: {||}) {
  const [tab, setTab] = useState('flame-chart');
  const [isFilterModalShowing, setIsFilterModalShowing] = useState(false);

  const showFilterModal = useCallback(() => setIsFilterModalShowing(true));
  const dismissFilterModal = useCallback(() => setIsFilterModalShowing(false));

  // TODO (profiling) Show selected "tab" view
  // TODO (profiling) Handle cases: no selected commit, no data for root
  const view = <div>Coming soon...</div>;

  return (
    <div className={styles.Profiler}>
      <div className={styles.LeftColumn}>
        <div className={styles.Toolbar}>
          <RecordToggle />
          <Button disabled title="Reload and start profiling">
            {/* TODO (profiling) Wire up reload button */}
            <ButtonIcon type="reload" />
          </Button>
          <div className={styles.VRule} />
          <TabBar
            currentTab={tab}
            id="Profiler"
            selectTab={setTab}
            size="small"
            tabs={tabs}
          />
          <div className={styles.Spacer} />
          <Button onClick={showFilterModal} title="Filter commits by duration">
            <ButtonIcon type="filter" />
          </Button>
          <SnapshotSelector />
        </div>
        <div className={styles.Content}>
          {view}
          {isFilterModalShowing && (
            <FilterModal dismissModal={dismissFilterModal} />
          )}
        </div>
      </div>
      <div className={styles.RightColumn}>
        {/* TODO (profiler) Dynamic information */}
        <div className={styles.Toolbar}>Commit information</div>
        <div className={styles.InspectedProperties} />
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

const RecortdingInProgress = () => (
  <div className={styles.Column}>
    <div className={styles.Header}>Profiling is in progress...</div>
    <div className={styles.Row}>
      Click the record button <RecordToggle /> to stop recording.
    </div>
  </div>
);
