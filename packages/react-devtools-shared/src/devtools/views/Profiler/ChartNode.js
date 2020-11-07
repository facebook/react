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
  return (
    <g className={styles.Group} transform={`translate(${x},${y})`}>
      <rect
        width={width}
        height={height}
        fill={color}
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
