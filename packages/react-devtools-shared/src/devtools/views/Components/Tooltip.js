/** @flow */

import React, {useCallback, useRef, useState} from 'react';
import {useSmartTooltip} from '../hooks';

import styles from './Tooltip.css';

const initialTooltipState = {height: 0, mouseX: 0, mouseY: 0, width: 0};

export default function Tooltip({children, label}: any) {
  const containerRef = useRef(null);
  const [tooltipState, setTooltipState] = useState(initialTooltipState);
  const tooltipRef = useSmartTooltip(tooltipState);

  const onMouseMove = useCallback(
    (event: SyntheticMouseEvent<*>) => {
      setTooltipState(getTooltipPosition(containerRef.current, event));
    },
    [setTooltipState],
  );

  return (
    <div
      className={styles.Container}
      onMouseMove={label !== null ? onMouseMove : undefined}
      ref={containerRef}>
      {label !== null && (
        <div ref={tooltipRef} className={styles.Tooltip}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function getTooltipPosition(
  relativeContainer,
  mouseEvent: SyntheticMouseEvent<*>,
) {
  if (relativeContainer !== null) {
    const {height, top, width} = relativeContainer.getBoundingClientRect();

    const mouseX = mouseEvent.clientX;
    const mouseY = mouseEvent.clientY - top;

    return {height, mouseX, mouseY, width};
  } else {
    return initialTooltipState;
  }
}
