// @flow

import React from 'react';
import { textHeight } from './constants';

import styles from './ChartNode.css';

type Props = {|
  color: string,
  height: number,
  isDimmed?: boolean,
  label: string,
  onClick: (event: SyntheticMouseEvent<*>) => mixed,
  onDoubleClick?: (event: SyntheticMouseEvent<*>) => mixed,
  placeLabelAboveNode?: boolean,
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
  onDoubleClick,
  width,
  x,
  y,
}: Props) {
  return (
    <g className={styles.Group} transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <rect
        width={width}
        height={height}
        fill={color}
        onClick={onClick}
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
          y={height < textHeight ? -textHeight : 0}
        >
          <div className={styles.Div}>{label}</div>
        </foreignObject>
      )}
    </g>
  );
}
