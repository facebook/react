/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useEffectEvent,
} from 'react';
import {ModalDialog} from '../ModalDialog';
import {ProfilerContext} from './ProfilerContext';
import TabBar from '../TabBar';
import ClearProfilingDataButton from './ClearProfilingDataButton';
import CommitFlamegraph from './CommitFlamegraph';
import CommitRanked from './CommitRanked';
import RootSelector from './RootSelector';
import {Timeline} from 'react-devtools-timeline/src/Timeline';
import SidebarEventInfo from './SidebarEventInfo';
import RecordToggle from './RecordToggle';
import ReloadAndProfileButton from './ReloadAndProfileButton';
import ProfilingImportExportButtons from './ProfilingImportExportButtons';
import SnapshotSelector from './SnapshotSelector';
import SidebarCommitInfo from './SidebarCommitInfo';
import NoProfilingData from './NoProfilingData';
import RecordingInProgress from './RecordingInProgress';
import ProcessingData from './ProcessingData';
import ProfilingNotSupported from './ProfilingNotSupported';
import SidebarSelectedFiberInfo from './SidebarSelectedFiberInfo';
import SettingsModal from 'react-devtools-shared/src/devtools/views/Settings/SettingsModal';
import SettingsModalContextToggle from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContextToggle';
import {SettingsModalContextController} from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContext';
import portaledContent from '../portaledContent';
import useResizableColumns from '../useResizableColumns';
import {StoreContext} from '../context';
import {TimelineContext} from 'react-devtools-timeline/src/TimelineContext';

import styles from './Profiler.css';

const LOCAL_STORAGE_KEY = 'React::DevTools::profilerResizeState';

// Toolbar compaction levels:
// 0 = full labels, everything on one row
// 1 = tab icons only, everything on one row
// 2 = tab icons only, root selector + snapshot on second row
const COMPACT_NONE = 0;
const COMPACT_ICONS = 1;
const COMPACT_WRAP = 2;

function Profiler(_: {}) {
  const {wrapperRef, resizeElementRef, onResizeStart, onResizeEnd, onResize} =
    useResizableColumns(LOCAL_STORAGE_KEY);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [compactLevel, setCompactLevel] = useState(COMPACT_NONE);
  // Remembers how wide the toolbar content was when it overflowed.
  // We only expand back when the container grows past that width,
  // so we don't get stuck in a compact → expand → overflow → compact loop.
  const expandThresholdsRef = useRef<Array<number>>([0, 0]);

  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const {
    didRecordCommits,
    isProcessingData,
    isProfiling,
    selectedCommitIndex,
    selectedFiberID,
    selectedTabID,
    selectTab,
    supportsProfiling,
    startProfiling,
    stopProfiling,
    selectPrevCommitIndex,
    selectNextCommitIndex,
  } = useContext(ProfilerContext);

  const {file: timelineTraceEventData, searchInputContainerRef} =
    useContext(TimelineContext);

  const {supportsTimeline} = useContext(StoreContext);

  const isLegacyProfilerSelected = selectedTabID !== 'timeline';

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const correctModifier = isMac ? event.metaKey : event.ctrlKey;
    // Cmd+E to start/stop profiler recording
    if (correctModifier && event.key === 'e') {
      if (isProfiling) {
        stopProfiling();
      } else {
        startProfiling();
      }
      event.preventDefault();
      event.stopPropagation();
    } else if (
      isLegacyProfilerSelected &&
      didRecordCommits &&
      selectedCommitIndex !== null
    ) {
      // Cmd+Left/Right (Mac) or Ctrl+Left/Right (Windows/Linux) to navigate commits
      if (
        correctModifier &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      ) {
        if (event.key === 'ArrowLeft') {
          selectPrevCommitIndex();
        } else {
          selectNextCommitIndex();
        }
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

  useEffect(() => {
    const div = wrapperRef.current;
    if (!div) {
      return;
    }
    const ownerWindow = div.ownerDocument.defaultView;
    ownerWindow.addEventListener('keydown', handleKeyDown);
    return () => {
      ownerWindow.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    if (toolbar == null) {
      return;
    }

    const checkOverflow = () => {
      if (toolbar.scrollWidth > toolbar.clientWidth) {
        // Content doesn't fit — remember how wide it was, then compact more.
        if (compactLevel < COMPACT_WRAP) {
          expandThresholdsRef.current[compactLevel] = toolbar.scrollWidth;
          setCompactLevel(compactLevel + 1);
        }
      } else if (compactLevel > COMPACT_NONE) {
        // Content fits — but only expand back if the container is now
        // at least as wide as the content was before we compacted.
        const prevThreshold = expandThresholdsRef.current[compactLevel - 1];
        if (prevThreshold > 0 && toolbar.clientWidth >= prevThreshold) {
          setCompactLevel(compactLevel - 1);
        }
      }
    };

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(toolbar);

    // Check immediately for content changes (e.g. profile data loaded)
    checkOverflow();

    return () => observer.disconnect();
    // Re-check when didRecordCommits changes because new elements
    // (e.g. SnapshotSelector) appear and may cause overflow.
  }, [compactLevel, didRecordCommits]);

  let view = null;
  if (didRecordCommits || selectedTabID === 'timeline') {
    switch (selectedTabID) {
      case 'flame-chart':
        view = <CommitFlamegraph />;
        break;
      case 'ranked-chart':
        view = <CommitRanked />;
        break;
      case 'timeline':
        view = <Timeline />;
        break;
      default:
        break;
    }
  } else if (isProfiling) {
    view = <RecordingInProgress />;
  } else if (isProcessingData) {
    view = <ProcessingData />;
  } else if (timelineTraceEventData) {
    view = <OnlyTimelineData />;
  } else if (supportsProfiling) {
    view = <NoProfilingData />;
  } else {
    view = <ProfilingNotSupported />;
  }

  let sidebar = null;
  if (!isProfiling && !isProcessingData && didRecordCommits) {
    switch (selectedTabID) {
      case 'flame-chart':
      case 'ranked-chart':
        // TRICKY
        // Handle edge case where no commit is selected because of a min-duration filter update.
        // In that case, the selected commit index would be null.
        // We could still show a sidebar for the previously selected fiber,
        // but it would be an odd user experience.
        // TODO (ProfilerContext) This check should not be necessary.
        if (selectedCommitIndex !== null) {
          if (selectedFiberID !== null) {
            sidebar = <SidebarSelectedFiberInfo />;
          } else {
            sidebar = <SidebarCommitInfo />;
          }
        }
        break;
      case 'timeline':
        sidebar = <SidebarEventInfo />;
        break;
      default:
        break;
    }
  }

  return (
    <SettingsModalContextController>
      <div ref={wrapperRef} className={styles.Profiler}>
        <div ref={resizeElementRef} className={styles.LeftColumn}>
          <div ref={toolbarRef} className={styles.Toolbar}>
            <RecordToggle disabled={!supportsProfiling} />
            <ReloadAndProfileButton disabled={!supportsProfiling} />
            <ClearProfilingDataButton />
            <ProfilingImportExportButtons />
            <div className={styles.VRule} />
            <TabBar
              compact={compactLevel >= COMPACT_ICONS}
              currentTab={selectedTabID}
              id="Profiler"
              selectTab={selectTab}
              tabs={supportsTimeline ? tabsWithTimeline : tabs}
              type="profiler"
            />
            {compactLevel < COMPACT_WRAP && <RootSelector />}
            <div className={styles.Spacer} />
            {!isLegacyProfilerSelected && (
              <div
                ref={searchInputContainerRef}
                className={styles.TimelineSearchInputContainer}
              />
            )}
            <SettingsModalContextToggle />
            {isLegacyProfilerSelected &&
              didRecordCommits &&
              compactLevel < COMPACT_WRAP && <SnapshotSelector />}
          </div>
          {compactLevel >= COMPACT_WRAP && (
            <div className={styles.SnapshotSelectorWrapper}>
              <RootSelector />
              {isLegacyProfilerSelected && didRecordCommits && (
                <SnapshotSelector />
              )}
            </div>
          )}
          <div className={styles.Content}>
            {view}
            <ModalDialog />
          </div>
        </div>
        <div className={styles.ResizeBarWrapper}>
          <div
            onPointerDown={onResizeStart}
            onPointerMove={onResize}
            onPointerUp={onResizeEnd}
            className={styles.ResizeBar}
          />
        </div>
        <div className={styles.RightColumn}>{sidebar}</div>
        <SettingsModal />
      </div>
    </SettingsModalContextController>
  );
}

const OnlyTimelineData = () => (
  <div className={styles.Column}>
    <div className={styles.Header}>Timeline only</div>
    <div className={styles.Row}>
      The current profile contains only Timeline data.
    </div>
  </div>
);

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
];

const tabsWithTimeline = [
  ...tabs,
  null, // Divider/separator
  {
    id: 'timeline',
    icon: 'timeline',
    label: 'Timeline',
    title: 'Timeline',
  },
];

export default (portaledContent(Profiler): component());
