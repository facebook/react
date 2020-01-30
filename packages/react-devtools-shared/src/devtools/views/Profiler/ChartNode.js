/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

import styles from './ChartNode.css';

type Props = {|
  color: string,
  height: number,
  isDimmed?: boolean,
  isHovered?: boolean,
  label: string,
  onClick: (event: SyntheticMouseEvent<*>) => mixed,
  onDoubleClick?: (event: SyntheticMouseEvent<*>) => mixed,
  onMouseEnter?: (event: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave?: (event: SyntheticMouseEvent<*>) => mixed,
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
  isHovered = false,
  label,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  textStyle,
  width,
  x,
  y,
}: Props) {
  let opacity = 1;
  if (isHovered) {
    opacity = 0.75;
  } else if (isDimmed) {
    opacity = 0.5;
  }

  return (
    <g className={styles.Group} transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <rect
        width={width}
        height={height}
        fill={color}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={styles.Rect}
        style={{
          opacity,
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
