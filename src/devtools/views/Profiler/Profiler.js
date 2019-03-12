// @flow

import React, { useCallback, useContext, useState } from 'react';
import { ProfilerContext, ProfilerContextController } from './ProfilerContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import TabBar from '../TabBar';
import FilterModal from './FilterModal';
import RecordToggle from './RecordToggle';
import SnapshotSelector from './SnapshotSelector';

import styles from './Profiler.css';

export type Props = {||};

export default function ProfilerOuter(_: Props) {
  return (
    <ProfilerContextController>
      <ProfilerInner />
    </ProfilerContextController>
  );
}

function ProfilerInner(_: Props) {
  const { hasProfilingData, isProfiling } = useContext(ProfilerContext);

  const showProfilingControls = !isProfiling && hasProfilingData;

  const [tab, setTab] = useState('flame-chart');
  const [isFilterModalShowing, setIsFilterModalShowing] = useState(false);

  const showFilterModal = useCallback(() => setIsFilterModalShowing(true));
  const dismissFilterModal = useCallback(() => setIsFilterModalShowing(false));

  let view = null;
  if (isProfiling) {
    view = <RecortdingInProgress />;
  } else if (!hasProfilingData) {
    view = <NoProfilingData />;
  } else {
    // TODO (profiling) Differentiate between no data and no data for the current root
    // TODO (profiling) Show selected "tab" view
    view = <div>Coming soon...</div>;
  }

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
            disabled={!showProfilingControls}
            id="Profiler"
            selectTab={setTab}
            size="small"
            tabs={tabs}
          />
          <div className={styles.Spacer} />
          <Button onClick={showFilterModal} title="Filter commits by duration">
            <ButtonIcon type="filter" />
          </Button>
          {showProfilingControls && <SnapshotSelector />}
        </div>
        <div className={styles.Content}>
          {view}
          {isFilterModalShowing && ( // TODO (profiler) Position when snapshot graph is open
            <FilterModal dismissModal={dismissFilterModal} />
          )}
        </div>
      </div>
      {showProfilingControls && (
        <div className={styles.RightColumn}>
          {/* TODO (profiler) Dynamic information */}
          <div className={styles.Toolbar}>Commit information</div>
          <div className={styles.InspectedProperties} />
        </div>
      )}
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
