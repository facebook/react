// @flow

import React, { useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { ProfilerContext } from './ProfilerContext';
import InteractionListItem from './InteractionListItem';
import NoInteractions from './NoInteractions';
import { StoreContext } from '../context';
import { scale } from './utils';

import styles from './Interactions.css';

import type { ChartData } from './InteractionsChartBuilder';
import type { InteractionWithCommits, ProfilingSummary } from './types';

export type ItemData = {|
  chartData: ChartData,
  interactions: Array<InteractionWithCommits>,
  labelWidth: number,
  profilingSummary: ProfilingSummary,
  scaleX: (value: number, fallbackValue: number) => number,
  selectedInteractionID: number | null,
  selectInteraction: (id: number | null) => void,
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
    rootID: ((rootID: any): number),
  });

  const itemData = useMemo<ItemData>(() => {
    // TODO (profiling) constants
    const labelWidth = Math.min(200, width / 5);
    const timelineWidth = width - labelWidth - 10;

    return {
      chartData,
      interactions,
      labelWidth,
      profilingSummary,
      scaleX: scale(0, chartData.lastInteractionTime, 0, timelineWidth),
      selectedInteractionID,
      selectInteraction,
    };
  }, [
    chartData,
    interactions,
    profilingSummary,
    selectedInteractionID,
    selectInteraction,
    width,
  ]);

  // TODO (profiling) Up/down arrow keys to select prev/next interaction.

  // If a commit contains no fibers with an actualDuration > 0,
  // Display a fallback message.
  if (interactions.length === 0) {
    return <NoInteractions height={height} width={width} />;
  }

  return (
    <FixedSizeList
      height={height}
      itemCount={interactions.length}
      itemData={itemData}
      itemSize={30}
      width={width}
    >
      {InteractionListItem}
    </FixedSizeList>
  );
}
