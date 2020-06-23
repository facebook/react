// @flow

import { useEffect, useRef, useState } from 'react';
import { durationToWidth, timestampToPosition } from './usePanAndZoom';
import { EVENT_SIZE } from '../constants';

function doesEventIntersectPosition(position, state, event) {
  const { duration, timestamp } = event;

  // Although it would be intuitive to search by time,
  // that can result in a confusing user experience for events of 0ms duration-
  // because we may choose to render these anyway.
  // The best way to compare is to convert event times to pixel coordinates and compare them.
  let startX = timestampToPosition(timestamp, state);
  let stopX = startX + durationToWidth(duration, state);

  if (duration !== undefined) {
    if (position >= startX && position <= stopX) {
      return true;
    }
  } else {
    startX -= EVENT_SIZE / 2;
    stopX = startX + EVENT_SIZE;

    if (position >= startX && position <= stopX) {
      return true;
    }
  }

  return false;
}

export default function useInteractiveEvents({
  canvasHeight,
  canvasRef,
  canvasWidth,
  eventQueue,
  state,
}) {
  const {
    canvasMouseX,
    canvasMouseY,
    fixedColumnWidth,
    fixedHeaderHeight,
    zoomLevel,
  } = state;

  let hoveredEvent = null;

  const [selectedEvent, setSelectedEvent] = useState(null);

  const lastResultRef = useRef({
    eventQueue,
    hoveredEvent,
    selectedEvent,
  });

  useEffect(() => {
    lastResultRef.current = {
      eventQueue,
      hoveredEvent,
      selectedEvent,
    };
  });

  useEffect(() => {
    const onClick = () => {
      const { hoveredEvent, selectedEvent } = lastResultRef.current;
      setSelectedEvent(hoveredEvent === selectedEvent ? null : hoveredEvent);
    };
    const canvas = canvasRef.current;
    canvas.addEventListener('click', onClick);
    return () => {
      canvas.removeEventListener('click', onClick);
    };
  }, [canvasRef]);

  if (eventQueue == null) {
    return [null, selectedEvent];
  }

  // Ignore mouse events that happen outside of the canvas.
  if (
    canvasMouseX >= fixedColumnWidth &&
    canvasMouseX < canvasWidth &&
    canvasMouseY >= fixedHeaderHeight &&
    canvasMouseY < canvasHeight
  ) {
    // Small mouse movements won't change the hovered event,
    // So always start by checking the last hovered event to see if we can avoid doing more work.
    const lastEvents = lastResultRef.current.eventQueue;
    const lastHoveredEvent = lastResultRef.current.hoveredEvent;

    if (lastHoveredEvent !== null && lastEvents === eventQueue) {
      if (doesEventIntersectPosition(canvasMouseX, state, lastHoveredEvent)) {
        hoveredEvent = lastHoveredEvent;
        return [hoveredEvent, selectedEvent];
      }
    }

    // TODO I think we coulsed use a binary search if we just looked at start times only!
    //
    // Since event data is sorted, it would be nice to use a binary search for faster comparison.
    // A simple binary search would not work here though, because of overlapping intervals.
    // For example, imagine an event sequence A-E, with overlapping events B and C, as shown below.
    //
    // AAAA BBBBBBBBBBBB DDD EE
    //          CCC
    //              (X)
    //
    // Given the cursor position X, it should match event B-
    // but if it happens to be compared to C first, it would next be compared to D,
    // and would ultimately fail to match any results.
    //
    // Eventually we should create a data structure like an interval tree while pre-processing,
    // so that we could more efficiently search it.
    // For now though we'll just do a brute force search since this is just a prototype. :)

    for (let i = 0; i < eventQueue.length; i++) {
      const event = eventQueue[i];
      if (doesEventIntersectPosition(canvasMouseX, state, event)) {
        hoveredEvent = event;
        return [hoveredEvent, selectedEvent];
      }
    }
  }

  return [hoveredEvent, selectedEvent];
}
