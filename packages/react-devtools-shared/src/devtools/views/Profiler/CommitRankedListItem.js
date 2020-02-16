/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {memo, useCallback, useContext} from 'react';
import {areEqual} from 'react-window';
import {minBarWidth} from './constants';
import {getGradientColor} from './utils';
import ChartNode from './ChartNode';
import {SettingsContext} from '../Settings/SettingsContext';

import type {ChartNode as ChartNodeType} from './RankedChartBuilder';
import type {ItemData} from './CommitRanked';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
  ...
};

function CommitRankedListItem({data, index, style}: Props) {
  const {
    chartData,
    hoverFiber,
    scaleX,
    selectedFiberIndex,
    selectFiber,
    width,
  } = data;

  const node = chartData.nodes[index];

  const {lineHeight} = useContext(SettingsContext);

  const handleClick = useCallback(
    event => {
      event.stopPropagation();
      selectFiber(node.id, node.name);
    },
    [node, selectFiber],
  );

  const handleMouseOver = useCallback(
    (event: SyntheticMouseEvent<*>, nodeData: ChartNodeType) => {
      const {id, name} = nodeData;
      event.stopPropagation();
      hoverFiber({id, name});
    },
    [hoverFiber],
  );

  const handleMouseOut = useCallback(
    (event: SyntheticMouseEvent<*>) => {
      event.stopPropagation();
      hoverFiber(null);
    },
    [hoverFiber],
  );

  // List items are absolutely positioned using the CSS "top" attribute.
  // The "left" value will always be 0.
  // Since height is fixed, and width is based on the node's duration,
  // We can ignore those values as well.
  const top = parseInt(style.top, 10);

  return (
    <ChartNode
      color={getGradientColor(node.value / chartData.maxValue)}
      height={lineHeight}
      isDimmed={index < selectedFiberIndex}
      key={node.id}
      label={node.label}
      onClick={handleClick}
      onMouseOver={event => handleMouseOver(event, node)}
      onMouseOut={event => handleMouseOut(event)}
      width={Math.max(minBarWidth, scaleX(node.value, width))}
      x={0}
      y={top}
    />
  );
}

export default memo<Props>(CommitRankedListItem, areEqual);
