/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import styles from './ChartNode.css';

type Props = {|
  color: string,
  height: number,
  isDimmed?: boolean,
  isSelected?: boolean,
  label: string,
  onClick: (event: SyntheticMouseEvent<*>) => mixed,
  onDoubleClick?: (event: SyntheticMouseEvent<*>) => mixed,
  onMouseEnter: (event: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave: (event: SyntheticMouseEvent<*>) => mixed,
  placeLabelAboveNode?: boolean,
  textStyle?: Object,
  width: number,
  x: number,
  y: number,
|};

const minWidthToDisplay = 35;

export default function ChartNode({
  color,
  height,
  isDimmed = false,
  isSelected = false,
  label,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  textStyle,
  width,
  x,
  y,
}: Props) {
  const fill = isSelected ? 'url(#selectedPattern)' : color;
  const patternDefs = isSelected ? (
    <defs>
      <pattern
        id="selectedPattern"
        patternUnits="userSpaceOnUse"
        width="4"
        height="4">
        <path
          d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
          style={{strokeWidth: 2.4, stroke: color}}
        />
      </pattern>
    </defs>
  ) : null;

  return (
    <g className={styles.Group} transform={`translate(${x},${y})`}>
      {patternDefs}
      <rect
        width={width}
        height={height}
        fill={fill}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDoubleClick={onDoubleClick}
        className={styles.Rect}
        style={{
          opacity: isDimmed ? 0.5 : 1,
        }}
      />
      {width >= minWidthToDisplay && (
        <foreignObject
          width={width}
          height={height}
          className={styles.ForeignObject}
          style={{
            paddingLeft: x < 0 ? -x : 0,
            opacity: isDimmed ? 0.75 : 1,
            display: width < minWidthToDisplay ? 'none' : 'block',
          }}
          y={0}>
          <div className={styles.Div} style={textStyle}>
            {label}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
