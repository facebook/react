/** @flow */

import React, {useRef} from 'react';

import styles from './Tooltip.css';

const initialTooltipState = {height: 0, mouseX: 0, mouseY: 0, width: 0};

export default function Tooltip({children, label}: any) {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);

  // update the position of the tooltip based on current mouse position
  const updateTooltipPosition = (event: SyntheticMouseEvent<*>) => {
    const element = tooltipRef.current;
    if (element != null) {
      // first find the mouse position
      const mousePosition = getMousePosition(containerRef.current, event);
      // use the mouse position to find the position of tooltip
      const {left, top} = getTooltipPosition(element, mousePosition);
      // update tooltip position
      element.style.left = left;
      element.style.top = top;
    }
  };

  const onMouseMove = (event: SyntheticMouseEvent<*>) => {
    updateTooltipPosition(event);
  };

  const tooltipClassName = label === null ? styles.hidden : '';

  return (
    <div
      className={styles.Container}
      onMouseMove={onMouseMove}
      ref={containerRef}>
      <div ref={tooltipRef} className={`${styles.Tooltip} ${tooltipClassName}`}>
        {label}
      </div>
      {children}
    </div>
  );
}

// Method used to find the position of the tooltip based on current mouse position
function getTooltipPosition(element, mousePosition) {
  const {height, mouseX, mouseY, width} = mousePosition;
  const TOOLTIP_OFFSET_X = 5;
  const TOOLTIP_OFFSET_Y = 15;
  let top = 0;
  let left = 0;

  // Let's check the vertical position.
  if (mouseY + TOOLTIP_OFFSET_Y + element.offsetHeight >= height) {
    // The tooltip doesn't fit below the mouse cursor (which is our
    // default strategy). Therefore we try to position it either above the
    // mouse cursor or finally aligned with the window's top edge.
    if (mouseY - TOOLTIP_OFFSET_Y - element.offsetHeight > 0) {
      // We position the tooltip above the mouse cursor if it fits there.
      top = `${mouseY - element.offsetHeight - TOOLTIP_OFFSET_Y}px`;
    } else {
      // Otherwise we align the tooltip with the window's top edge.
      top = '0px';
    }
  } else {
    top = `${mouseY + TOOLTIP_OFFSET_Y}px`;
  }

  // Now let's check the horizontal position.
  if (mouseX + TOOLTIP_OFFSET_X + element.offsetWidth >= width) {
    // The tooltip doesn't fit at the right of the mouse cursor (which is
    // our default strategy). Therefore we try to position it either at the
    // left of the mouse cursor or finally aligned with the window's left
    // edge.
    if (mouseX - TOOLTIP_OFFSET_X - element.offsetWidth > 0) {
      // We position the tooltip at the left of the mouse cursor if it fits
      // there.
      left = `${mouseX - element.offsetWidth - TOOLTIP_OFFSET_X}px`;
    } else {
      // Otherwise, align the tooltip with the window's left edge.
      left = '0px';
    }
  } else {
    left = `${mouseX + TOOLTIP_OFFSET_X * 2}px`;
  }

  return {left, top};
}

// method used to find the current mouse position inside the container
function getMousePosition(
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
