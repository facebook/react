// @flow

import React, { useCallback, useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { ProfilerContext } from './ProfilerContext';
import InteractionListItem from './InteractionListItem';
import NoInteractions from './NoInteractions';
import { StoreContext } from '../context';
import { scale } from './utils';

import styles from './Interactions.css';

import type { ChartData } from './InteractionsChartBuilder';
import type { TabID } from './ProfilerContext';
import type {
  InteractionWithCommitsFrontend,
  ProfilingSummaryFrontend,
} from './types';

export type ItemData = {|
  chartData: ChartData,
  interactions: Array<InteractionWithCommitsFrontend>,
  labelWidth: number,
  profilingSummary: ProfilingSummaryFrontend,
  scaleX: (value: number, fallbackValue: number) => number,
  selectedInteractionID: number | null,
  selectCommitIndex: (id: number | null) => void,
  selectInteraction: (id: number | null) => void,
  selectTab: (id: TabID) => void,
|};

export default function InteractionsAutoSizer(_: {||}) {
  return (
    <div className={styles.Container}>
      <AutoSizer>
        {({ height, width }) => <Interactions height={height} width={width} />}
      </AutoSizer>
    </div>
  );
}

function Interactions({ height, width }: {| height: number, width: number |}) {
  const {
    rendererID,
    rootID,
    selectedInteractionID,
    selectInteraction,
    selectCommitIndex,
    selectTab,
  } = useContext(ProfilerContext);
  const { profilingCache } = useContext(StoreContext);

  const interactions = profilingCache.Interactions.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const profilingSummary = profilingCache.ProfilingSummary.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const chartData = profilingCache.getInteractionsChartData({
    interactions,
    profilingSummary,
  });

  const handleKeyDown = useCallback(
    event => {
      let index;
      switch (event.key) {
        case 'ArrowDown':
          index = interactions.findIndex(
            interaction => interaction.id === selectedInteractionID
          );
          selectInteraction(Math.min(interactions.length - 1, index + 1));
          event.stopPropagation();
          break;
        case 'ArrowUp':
          index = interactions.findIndex(
            interaction => interaction.id === selectedInteractionID
          );
          selectInteraction(Math.max(0, index - 1));
          event.stopPropagation();
          break;
        default:
          break;
      }
    },
    [interactions, selectedInteractionID, selectInteraction]
  );

  const itemData = useMemo<ItemData>(() => {
    const interactionCommitSize = parseInt(
      getComputedStyle((document.body: any)).getPropertyValue(
        '--interaction-commit-size'
      ),
      10
    );
    const interactionLabelWidth = parseInt(
      getComputedStyle((document.body: any)).getPropertyValue(
        '--interaction-label-width'
      ),
      10
    );

    const labelWidth = Math.min(interactionLabelWidth, width / 5);
    const timelineWidth = width - labelWidth - interactionCommitSize;

    return {
      chartData,
      interactions,
      labelWidth,
      profilingSummary,
      scaleX: scale(0, chartData.lastInteractionTime, 0, timelineWidth),
      selectedInteractionID,
      selectCommitIndex,
      selectInteraction,
      selectTab,
    };
  }, [
    chartData,
    interactions,
    profilingSummary,
    selectedInteractionID,
    selectCommitIndex,
    selectInteraction,
    selectTab,
    width,
  ]);

  // If a commit contains no fibers with an actualDuration > 0,
  // Display a fallback message.
  if (interactions.length === 0) {
    return <NoInteractions height={height} width={width} />;
  }

  return (
    <div className={styles.FocusTarget} onKeyDown={handleKeyDown} tabIndex={0}>
      <FixedSizeList
        height={height}
        itemCount={interactions.length}
        itemData={itemData}
        itemSize={30}
        width={width}
      >
        {InteractionListItem}
      </FixedSizeList>
    </div>
  );
}
