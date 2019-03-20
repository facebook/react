// @flow

import React, { memo, useCallback } from 'react';
import { areEqual } from 'react-window';

import styles from './InteractionListItem.css';

import type { ItemData } from './Interactions';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
};

function InteractionListItem({ data: itemData, index, style }: Props) {
  const { interactions, selectedInteractionID, selectInteraction } = itemData;

  const interaction = interactions[index];

  const handleClick = useCallback(() => {
    selectInteraction(interaction.id);
  }, [interaction, selectInteraction]);

  // TODO (profiling Render commit bar)

  return (
    <div
      className={
        selectedInteractionID === interaction.id
          ? styles.SelectedInteraction
          : styles.Interaction
      }
      onClick={handleClick}
      style={style}
      title={interaction.name}
    >
      {interaction.name}
    </div>
  );
}

export default memo<Props>(InteractionListItem, areEqual);
