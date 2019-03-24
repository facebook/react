// @flow

import React, { memo, useCallback } from 'react';
import { areEqual } from 'react-window';
import { getGradientColor } from './utils';

import styles from './InteractionListItem.css';

import type { ItemData } from './Interactions';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
};

function InteractionListItem({ data: itemData, index, style }: Props) {
  const {
    chartData,
    interactions,
    labelWidth,
    profilingSummary,
    scaleX,
    selectedInteractionID,
    selectCommitIndex,
    selectInteraction,
    selectTab,
  } = itemData;

  const { maxCommitDuration } = chartData;
  const { commitDurations, commitTimes } = profilingSummary;

  const interaction = interactions[index];

  const handleClick = useCallback(() => {
    selectInteraction(interaction.id);
  }, [interaction, selectInteraction]);

  const startTime = interaction.timestamp;
  const stopTime =
    interaction.commits.length > 0
      ? commitTimes[interaction.commits[interaction.commits.length - 1]]
      : interaction.timestamp;

  const viewCommit = (commitIndex: number) => {
    selectTab('flame-chart');
    selectCommitIndex(commitIndex);
  };

  return (
    <div
      className={
        selectedInteractionID === interaction.id
          ? styles.SelectedInteraction
          : styles.Interaction
      }
      onClick={handleClick}
      style={style}
    >
      <div
        className={styles.Name}
        style={{ maxWidth: labelWidth }}
        title={interaction.name}
      >
        {interaction.name}
      </div>
      <div
        className={styles.InteractionLine}
        style={{
          left: labelWidth + scaleX(startTime, 0),
          width: scaleX(stopTime - startTime, 0),
        }}
      />
      {interaction.commits.map(commitIndex => (
        <div
          className={styles.CommitBox}
          key={commitIndex}
          onClick={() => viewCommit(commitIndex)}
          style={{
            backgroundColor: getGradientColor(
              Math.min(
                1,
                Math.max(0, commitDurations[commitIndex] / maxCommitDuration)
              ) || 0
            ),
            left: labelWidth + scaleX(commitTimes[commitIndex], 0),
          }}
        />
      ))}
    </div>
  );
}

export default memo<Props>(InteractionListItem, areEqual);
