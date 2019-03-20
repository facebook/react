// @flow

import React, { useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { ProfilerContext } from './ProfilerContext';
import InteractionListItem from './InteractionListItem';
import NoInteractions from './NoInteractions';
import { StoreContext } from '../context';

import styles from './Interactions.css';

import type { InteractionWithCommits } from './types';

export type ItemData = {|
  interactions: Array<InteractionWithCommits>,
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

  const { interactions } = profilingCache.Interactions.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const itemData = useMemo<ItemData>(
    () => ({
      interactions,
      selectedInteractionID,
      selectInteraction,
    }),
    [interactions, selectedInteractionID, selectInteraction]
  );

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
