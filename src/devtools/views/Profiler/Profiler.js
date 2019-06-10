// @flow

import React, { Fragment, useContext } from 'react';
import { CommitFilterModalContextController } from './CommitFilterModalContext';
import { ModalDialog } from '../ModalDialog';
import { ProfilerContext } from './ProfilerContext';
import TabBar from '../TabBar';
import ClearProfilingDataButton from './ClearProfilingDataButton';
import CommitFlamegraph from './CommitFlamegraph';
import CommitRanked from './CommitRanked';
import CommitFilterModal from './CommitFilterModal';
import Interactions from './Interactions';
import RootSelector from './RootSelector';
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

function Profiler(_: {||}) {
  const {
    didRecordCommits,
    isProcessingData,
    isProfiling,
    selectedFiberID,
    selectedTabID,
    selectTab,
    supportsProfiling,
  } = useContext(ProfilerContext);

  let view = null;
  if (didRecordCommits) {
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
  } else if (isProfiling) {
    view = <RecordingInProgress />;
  } else if (isProcessingData) {
    view = <ProcessingData />;
  } else if (supportsProfiling) {
    view = <NoProfilingData />;
  } else {
    view = <ProfilingNotSupported />;
  }

  let sidebar = null;
  if (!isProfiling && !isProcessingData && didRecordCommits) {
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
  }

  return (
    <CommitFilterModalContextController>
      <div className={styles.Profiler}>
        <div className={styles.LeftColumn}>
          <div className={styles.Toolbar}>
            <RecordToggle disabled={!supportsProfiling} />
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
            <RootSelector />
            <div className={styles.Spacer} />
            <ToggleCommitFilterModalButton />
            {didRecordCommits && (
              <Fragment>
                <div className={styles.VRule} />
                <SnapshotSelector />
              </Fragment>
            )}
          </div>
          <div className={styles.Content}>
            {view}
            <CommitFilterModal />
            <ModalDialog />
          </div>
        </div>
        <div className={styles.RightColumn}>{sidebar}</div>
      </div>
    </CommitFilterModalContextController>
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

const ProcessingData = () => (
  <div className={styles.Column}>
    <div className={styles.Header}>Processing data...</div>
    <div className={styles.Row}>This should only take a minute.</div>
  </div>
);

const RecordingInProgress = () => (
  <div className={styles.Column}>
    <div className={styles.Header}>Profiling is in progress...</div>
    <div className={styles.Row}>
      Click the record button <RecordToggle /> to stop recording.
    </div>
  </div>
);

export default portaledContent(Profiler);
