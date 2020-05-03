/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {memo, useCallback} from 'react';
import {areEqual} from 'react-window';
import {getGradientColor} from './utils';

import styles from './InteractionListItem.css';

import type {ItemData} from './Interactions';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
  ...
};

function InteractionListItem({data: itemData, index, style}: Props) {
  const {
    chartData,
    dataForRoot,
    labelWidth,
    scaleX,
    selectedInteractionID,
    selectCommitIndex,
    selectInteraction,
    selectTab,
  } = itemData;

  const {commitData } = dataForRoot;
  const {interactions, lastInteractionTime, maxCommitDuration} = chartData;

  const interaction = interactions[index];
  if (interaction == null) {
    throw Error(`Could not find interaction #${index}`);
  }

  const handleClick = useCallback(() => {
    selectInteraction(interaction.id);
  }, [interaction, selectInteraction]);

  const startTime = interaction.timestamp;
  const stopTime = lastInteractionTime;

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
      style={style}>
      <div
        className={styles.Name}
        style={{maxWidth: labelWidth}}
        title={interaction.name}>
        {interaction.name}
      </div>
      <div
        className={styles.InteractionLine}
        style={{
          left: labelWidth + scaleX(startTime, 0),
          width: scaleX(stopTime - startTime, 0),
        }}
      />
      {commitData.map((commit, commitIndex) => (
        <div
          className={styles.CommitBox}
          key={commitIndex}
          onClick={() => viewCommit(commitIndex)}
          style={{
            backgroundColor: getGradientColor(
              Math.min(
                1,
                Math.max(
                  0,
                  commit.duration / maxCommitDuration,
                ),
              ) || 0,
            ),
            left: labelWidth + scaleX(commit.timestamp, 0),
          }}
        />
      ))}
    </div>
  );
}

export default memo<Props>(InteractionListItem, areEqual);
