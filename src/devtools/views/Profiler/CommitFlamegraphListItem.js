// @flow

import React, { Fragment, memo, useCallback } from 'react';
import { areEqual } from 'react-window';
import { barHeight, barWidthThreshold } from './constants';
import { getGradientColor } from './utils';
import ChartNode from './ChartNode';

import type { ItemData } from './CommitFlamegraph';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
};

function CommitFlamegraphListItem({ data, index, style }: Props) {
  const {
    chartData,
    scaleX,
    selectedChartNode,
    selectedChartNodeIndex,
    selectFiber,
    width,
  } = data;
  const { maxSelfDuration, rows } = chartData;

  const handleClick = useCallback(
    (event: MouseEvent, id: number, name: string) => {
      event.stopPropagation();
      selectFiber(id, name);
    },
    [selectFiber]
  );

  // List items are absolutely positioned using the CSS "top" attribute.
  // The "left" value will always be 0.
  // Since height is fixed, and width is based on the node's duration,
  // We can ignore those values as well.
  const top = parseInt(style.top, 10);

  const row = rows[index];

  let selectedNodeOffset = scaleX(selectedChartNode.offset, width);

  return (
    <Fragment>
      {row.map(chartNode => {
        const {
          didRender,
          id,
          label,
          name,
          offset,
          selfDuration,
          treeBaseDuration,
        } = chartNode;

        const nodeOffset = scaleX(offset, width);
        const nodeWidth = scaleX(treeBaseDuration, width);

        // Filter out nodes that are too small to see or click.
        // This also helps render large trees faster.
        if (nodeWidth < barWidthThreshold) {
          return null;
        }

        // Filter out nodes that are outside of the horizontal window.
        if (
          nodeOffset + nodeWidth < selectedNodeOffset ||
          nodeOffset > selectedNodeOffset + width
        ) {
          return null;
        }

        let color = 'var(--color-commit-did-not-render)';
        if (didRender) {
          color = getGradientColor(selfDuration / maxSelfDuration);
        }

        return (
          <ChartNode
            color={color}
            height={barHeight}
            isDimmed={index < selectedChartNodeIndex}
            key={id}
            label={label}
            onClick={event => handleClick(event, id, name)}
            width={nodeWidth}
            x={nodeOffset - selectedNodeOffset}
            y={top}
          />
        );
      })}
    </Fragment>
  );
}

export default memo<Props>(CommitFlamegraphListItem, areEqual);
