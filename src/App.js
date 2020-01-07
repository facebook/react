// @flow

import React, {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import memoize from 'memoize-one';
import usePanAndZoom from './usePanAndZoom';
import { getCanvasContext } from './canvasUtils';
import {
  durationToWidth,
  positionToTimestamp,
  timestampToPosition,
} from './usePanAndZoom';
import useInteractiveEvents from './useInteractiveEvents';
import EventTooltip from './EventTooltip';
import SelectedEvent from './SelectedEvent';
import preprocessData from './preprocessData';
import preprocessFlamechart from './preprocessFlamechart';
import styles from './App.css';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  BAR_SPACER_SIZE,
  BAR_HEIGHT,
  COLORS,
  SECTION_GUTTER_SIZE,
  EVENT_SIZE,
  INTERVAL_TIMES,
  LABEL_SIZE,
  LABEL_FONT_SIZE,
  MARKER_GUTTER_SIZE,
  MARKER_FONT_SIZE,
  MAX_INTERVAL_SIZE_PX,
  MARKER_TEXT_PADDING,
  MARKER_HEIGHT,
  MARKER_TICK_HEIGHT,
} from './constants';

import JSON_PATH from 'url:../static/small-devtools.json';

import type {
  FlamechartData,
  ReactEvent,
  ReactMeasure,
  ReactProfilerData,
} from './types';

const REACT_PRIORITIES = ['unscheduled', 'high', 'normal', 'low'];

const ROW_CSS_PIXELS_HEIGHT = 16;
const TEXT_CSS_PIXELS_OFFSET_START = 3;
const TEXT_CSS_PIXELS_OFFSET_TOP = 11;
const FONT_SIZE = 10;
const BORDER_OPACITY = 0.4;

const REACT_DEVTOOLS_FONT_SIZE = 12;
const REACT_GUTTER_SIZE = 4;
const REACT_EVENT_SIZE = 6;
const REACT_WORK_SIZE = 12;
const REACT_WORK_DEPTH_OFFSET = 3;
const REACT_EVENT_BORDER_SIZE = 1;
const REACT_PRIORITY_BORDER_SIZE = 1;
const REACT_DEVTOOLS_PRIORITY_SIZE =
  REACT_GUTTER_SIZE * 3 +
  REACT_EVENT_SIZE +
  REACT_WORK_SIZE +
  REACT_PRIORITY_BORDER_SIZE;
const REACT_DEVTOOLS_CANVAS_HEIGHT =
  (REACT_DEVTOOLS_PRIORITY_SIZE + REACT_PRIORITY_BORDER_SIZE) *
  REACT_PRIORITIES.length;

const FLAMECHART_FONT_SIZE = 10;
const FLAMECHART_FRAME_HEIGHT = 16;
const FLAMECHART_TEXT_PADDING = 3;

const LABEL_FIXED_WIDTH = LABEL_SIZE + REACT_PRIORITY_BORDER_SIZE;
const HEADER_HEIGHT_FIXED = MARKER_HEIGHT + REACT_PRIORITY_BORDER_SIZE;

// Time mark intervals vary based on the current zoom range and the time it represents.
// In Chrome, these seem to range from 70-140 pixels wide.
// Time wise, they represent intervals of e.g. 1s, 500ms, 200ms, 100ms, 50ms, 20ms.
// Based on zoom, we should determine which amount to actually show.
function getTimeTickInterval(zoomLevel) {
  let interval = INTERVAL_TIMES[0];
  for (let i = 0; i < INTERVAL_TIMES.length; i++) {
    const currentInteval = INTERVAL_TIMES[i];
    const pixels = currentInteval * zoomLevel;
    if (pixels <= MAX_INTERVAL_SIZE_PX) {
      interval = currentInteval;
    }
  }
  return interval;
}

function getHoveredEvent(data, flamechart, state) {
  const { canvasMouseX, canvasMouseY, offsetY } = state;

  if (canvasMouseX < LABEL_FIXED_WIDTH || canvasMouseY < HEADER_HEIGHT_FIXED) {
    return null;
  }

  if (canvasMouseY + offsetY < REACT_DEVTOOLS_CANVAS_HEIGHT) {
    if (data != null) {
      const priorityIndex = Math.floor(
        (canvasMouseY - HEADER_HEIGHT_FIXED + offsetY) /
          REACT_DEVTOOLS_PRIORITY_SIZE
      );
      if (priorityIndex >= REACT_PRIORITIES.length) {
        return null;
      }

      const priority = REACT_PRIORITIES[priorityIndex];
      const baseY =
        HEADER_HEIGHT_FIXED +
        REACT_DEVTOOLS_PRIORITY_SIZE * priorityIndex -
        offsetY;
      const eventMinY = baseY + REACT_GUTTER_SIZE / 2;
      const eventMaxY = eventMinY + REACT_EVENT_SIZE + REACT_GUTTER_SIZE;
      const measureMinY = eventMaxY;
      const measureMaxY = measureMinY + REACT_WORK_SIZE + REACT_GUTTER_SIZE;

      let events = null,
        measures = null;
      if (canvasMouseY >= eventMinY && canvasMouseY <= eventMaxY) {
        events = data[priority].events;
      } else if (canvasMouseY >= measureMinY && canvasMouseY <= measureMaxY) {
        measures = data[priority].measures;
      }

      if (events !== null) {
        for (let index = events.length - 1; index >= 0; index--) {
          const event = events[index];
          const { timestamp } = event;

          const eventX = timestampToPosition(timestamp, state);
          const startX = eventX - REACT_EVENT_SIZE / 2;
          const stopX = eventX + REACT_EVENT_SIZE / 2;
          if (canvasMouseX >= startX && canvasMouseX <= stopX) {
            return {
              event,
              flamechartNode: null,
              measure: null,
              priorityIndex,
              data,
            };
          }
        }
      } else if (measures !== null) {
        // Because data ranges may overlap, wew ant to find the last intersecting item.
        // This will always be the one on "top" (the one the user is hovering over).
        for (let index = measures.length - 1; index >= 0; index--) {
          const measure = measures[index];
          const { duration, timestamp } = measure;

          const pointerTime = positionToTimestamp(canvasMouseX, state);

          if (pointerTime >= timestamp && pointerTime <= timestamp + duration) {
            return {
              event: null,
              flamechartNode: null,
              measure,
              priorityIndex,
              data,
            };
          }
        }
      }
    }
  } else {
    if (flamechart !== null) {
      const layerIndex = Math.floor(
        (canvasMouseY +
          offsetY -
          HEADER_HEIGHT_FIXED -
          REACT_DEVTOOLS_CANVAS_HEIGHT) /
          FLAMECHART_FRAME_HEIGHT
      );
      const layer = flamechart.layers[layerIndex];

      if (layer != null) {
        let startIndex = 0;
        let stopIndex = layer.length - 1;
        while (startIndex <= stopIndex) {
          const currentIndex = Math.floor((startIndex + stopIndex) / 2);
          const flamechartNode = layer[currentIndex];

          const { end, start } = flamechartNode;

          const width = durationToWidth((end - start) / 1000, state);
          const x = Math.floor(timestampToPosition(start / 1000, state));

          if (x <= canvasMouseX && x + width >= canvasMouseX) {
            return {
              event: null,
              flamechartNode,
              measure: null,
              priorityIndex: null,
              data,
            };
          }

          if (x > canvasMouseX) {
            stopIndex = currentIndex - 1;
          } else {
            startIndex = currentIndex + 1;
          }
        }
      }
    }
  }

  return null;
}

const cachedFlamegraphTextWidths = new Map();
const trimFlamegraphText = (context, text, width) => {
  for (let i = text.length - 1; i >= 0; i--) {
    const trimmedText = i === text.length - 1 ? text : text.substr(0, i) + '…';

    let measuredWidth = cachedFlamegraphTextWidths.get(trimmedText);
    if (measuredWidth == null) {
      measuredWidth = context.measureText(trimmedText).width;
      cachedFlamegraphTextWidths.set(trimmedText, measuredWidth);
    }

    if (measuredWidth <= width) {
      return trimmedText;
    }
  }

  return null;
};

const renderReact = ({
  canvasWidth,
  context,
  eventOrMeasure,
  priorityIndex,
  showGroupHighlight,
  showHoverHighlight,
  state,
}) => {
  const { timestamp, type } = eventOrMeasure;
  const { offsetY } = state;

  let fillStyle = null;
  let hoveredFillStyle = null;
  let groupSelectedFillStyle = null;
  let x, y, width;

  switch (type) {
    case 'commit':
    case 'render-idle':
    case 'render':
    case 'layout-effects':
    case 'passive-effects':
      const { depth, duration } = ((eventOrMeasure: any): ReactMeasure);

      // We could change the max to 0 and just skip over rendering anything that small,
      // but this has the effect of making the chart look very empty when zoomed out.
      // So long as perf is okay- it might be best to err on the side of showing things.
      width = durationToWidth(duration, state);
      if (width <= 0) {
        return; // Too small to render at this zoom level
      }

      x = timestampToPosition(timestamp, state);
      if (x + width < 0 || canvasWidth < x) {
        return; // Not in view
      }

      switch (type) {
        case 'commit':
          fillStyle = COLORS.REACT_COMMIT;
          hoveredFillStyle = COLORS.REACT_COMMIT_HOVER;
          groupSelectedFillStyle = COLORS.REACT_COMMIT_SELECTED;
          break;
        case 'render-idle':
          // We could render idle time as diagonal hashes.
          // This looks nicer when zoomed in, but not so nice when zoomed out.
          // color = context.createPattern(getIdlePattern(), 'repeat');
          fillStyle = COLORS.REACT_IDLE;
          hoveredFillStyle = COLORS.REACT_IDLE_HOVER;
          groupSelectedFillStyle = COLORS.REACT_IDLE_SELECTED;
          break;
        case 'render':
          fillStyle = COLORS.REACT_RENDER;
          hoveredFillStyle = COLORS.REACT_RENDER_HOVER;
          groupSelectedFillStyle = COLORS.REACT_RENDER_SELECTED;
          break;
        case 'layout-effects':
          fillStyle = COLORS.REACT_LAYOUT_EFFECTS;
          hoveredFillStyle = COLORS.REACT_LAYOUT_EFFECTS_HOVER;
          groupSelectedFillStyle = COLORS.REACT_LAYOUT_EFFECTS_SELECTED;
          break;
        case 'passive-effects':
          fillStyle = COLORS.REACT_PASSIVE_EFFECTS;
          hoveredFillStyle = COLORS.REACT_PASSIVE_EFFECTS_HOVER;
          groupSelectedFillStyle = COLORS.REACT_PASSIVE_EFFECTS_SELECTED;
          break;
        default:
          console.warn(`Unexpected type "${type}"`);
          break;
      }

      y =
        HEADER_HEIGHT_FIXED +
        (REACT_DEVTOOLS_PRIORITY_SIZE * priorityIndex +
          REACT_GUTTER_SIZE +
          REACT_EVENT_SIZE +
          REACT_GUTTER_SIZE) -
        offsetY;

      let height = REACT_WORK_SIZE - REACT_WORK_DEPTH_OFFSET * depth;

      const lineWidth = Math.floor(REACT_EVENT_BORDER_SIZE);

      if (depth > 0) {
        context.fillStyle = COLORS.REACT_WORK_BORDER;
        context.fillRect(
          Math.floor(x),
          Math.floor(y),
          Math.floor(width),
          Math.floor(height)
        );

        height -= lineWidth;

        if (width > lineWidth * 2) {
          width -= lineWidth * 2;
          x += lineWidth;
        }
      }

      // $FlowFixMe We know these won't be null
      context.fillStyle = showHoverHighlight
        ? hoveredFillStyle
        : showGroupHighlight
        ? groupSelectedFillStyle
        : fillStyle;
      context.fillRect(
        Math.floor(x),
        Math.floor(y),
        Math.floor(width),
        Math.floor(height)
      );
      break;
    case 'schedule-render':
    case 'schedule-state-update':
    case 'suspend':
      const { isCascading } = ((eventOrMeasure: any): ReactEvent);

      x = timestampToPosition(timestamp, state);
      if (x + EVENT_SIZE / 2 < 0 || canvasWidth < x) {
        return; // Not in view
      }

      switch (type) {
        case 'schedule-render':
        case 'schedule-state-update':
          if (isCascading) {
            fillStyle = showHoverHighlight
              ? COLORS.REACT_SCHEDULE_CASCADING_HOVER
              : COLORS.REACT_SCHEDULE_CASCADING;
          } else {
            fillStyle = showHoverHighlight
              ? COLORS.REACT_SCHEDULE_HOVER
              : COLORS.REACT_SCHEDULE;
          }
          break;
        case 'suspend':
          fillStyle = showHoverHighlight
            ? COLORS.REACT_SUSPEND_HOVER
            : COLORS.REACT_SUSPEND;
          break;
        default:
          console.warn(`Unexpected event or measure type "${type}"`);
          break;
      }

      if (fillStyle !== null) {
        const circumference = REACT_EVENT_SIZE;
        y =
          HEADER_HEIGHT_FIXED +
          (REACT_DEVTOOLS_PRIORITY_SIZE * priorityIndex +
            REACT_GUTTER_SIZE +
            REACT_EVENT_SIZE / 2) -
          offsetY;

        context.beginPath();
        context.fillStyle = fillStyle;
        context.arc(x, y, circumference / 2, 0, 2 * Math.PI);
        context.fill();
      }
      break;
    default:
      console.warn(`Unexpected event or measure type "${type}"`);
      break;
  }
};

// The canvas we're rendering looks a little like the outline below.
// Left labels mark different scheduler REACT_PRIORITIES,
// and top labels mark different times (based on how long the data runs and how zoomed in we are).
// The content in the bottom right area is scrollable, but the top/left labels are fixed.
//
// ┌-----------------------------------
// |             t⁰    t¹    t²    ...
// ├-------------┬---------------------
// | unscheduled ┋ <events...>
// ├-------------┼---------------------
// | high        ┋ <events...>
// ├-------------┼---------------------
// | normal      ┋ <events...>
// ├-------------┼---------------------
// | low         ┋ <events...>
// ├-------------┼---------------------
// |             ┋ <flame graph...>
// |             ┋
// |             ┋
// └-------------┴---------------------
//
// Because everything we draw on a canvas is drawn on top of what was already there,
// we render the graph in several passes, each pass creating a layer:
//                                    ,────────
//                     axis labels → /
//                               ,──/
//             profiling data → /  '───────────
//                          ,─ /
//     axis marker lines → /  '────────────────
//                     ,─ /
// background fills → /  '─────────────────────
//                   /
//                  '──────────────────────────
//
// TODO Passing "state" directly breaks memoization for e.g. mouse moves
const renderCanvas = memoize(
  (
    data,
    flamechart,
    canvas,
    canvasWidth,
    canvasHeight,
    state,
    hoveredEvent
  ) => {
    const { offsetX, offsetY, zoomLevel } = state;

    const context = getCanvasContext(canvas, canvasHeight, canvasWidth, true);

    // Fill the canvas with the background color
    context.fillStyle = COLORS.BACKGROUND;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    // Charting data renders within this region of pixels as "scrollable" content.
    // Time markers (top) and priority labels (left) are fixed content.
    const scrollableCanvasWidth = canvasWidth - LABEL_FIXED_WIDTH;

    let y = 0;

    const interval = getTimeTickInterval(zoomLevel);
    const intervalSize = interval * zoomLevel;
    const firstIntervalPosition =
      0 - offsetX + Math.floor(offsetX / intervalSize) * intervalSize;

    // Render all charting data (once it's loaded and processed) within the "scrollable" region.
    // TODO (windowing) We can avoid rendering all of this if we've scrolled some of it off screen.
    if (data != null) {
      // Time markers do not scroll off screen; they are always rendered at a fixed vertical position.
      y = HEADER_HEIGHT_FIXED - offsetY;

      REACT_PRIORITIES.forEach((priority, priorityIndex) => {
        const currentPriority = data[priority];
        currentPriority.events.forEach(event => {
          const showHoverHighlight =
            hoveredEvent && hoveredEvent.event === event;
          renderReact({
            canvasWidth,
            context,
            eventOrMeasure: event,
            showGroupHighlight: false,
            showHoverHighlight,
            priorityIndex,
            state,
          });
        });
        currentPriority.measures.forEach(measure => {
          const showHoverHighlight =
            hoveredEvent && hoveredEvent.measure === measure;
          const showGroupHighlight =
            hoveredEvent &&
            hoveredEvent.measure !== null &&
            hoveredEvent.measure.batchUID === measure.batchUID;
          renderReact({
            canvasWidth,
            context,
            eventOrMeasure: measure,
            priorityIndex,
            showGroupHighlight,
            showHoverHighlight,
            state,
          });
        });

        // Draw the hovered and/or selected items on top so they stand out.
        // This is helpful if there are multiple (overlapping) items close to each other.
        if (hoveredEvent !== null && hoveredEvent.event !== null) {
          renderReact({
            canvasWidth,
            context,
            eventOrMeasure: hoveredEvent.event,
            showGroupHighlight: false,
            showHoverHighlight: true,
            priorityIndex: hoveredEvent.priorityIndex,
            state,
          });
        }
      });
    }

    // Flame graph data renders below the prioritized React data.
    // TODO Timestamp alignment is off by a few hundred me from our user timing marks; why?
    if (flamechart !== null) {
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.font = `${FLAMECHART_FONT_SIZE}px sans-serif`;

      for (let i = 0; i < flamechart.layers.length; i++) {
        const nodes = flamechart.layers[i];

        const y = Math.floor(
          HEADER_HEIGHT_FIXED +
            REACT_DEVTOOLS_CANVAS_HEIGHT +
            i * FLAMECHART_FRAME_HEIGHT -
            offsetY
        );
        if (
          y + FLAMECHART_FRAME_HEIGHT < HEADER_HEIGHT_FIXED ||
          canvasHeight < y
        ) {
          continue; // Not in view
        }

        for (let j = 0; j < nodes.length; j++) {
          const { end, node, start } = nodes[j];
          const { name } = node.frame;

          let showHoverHighlight =
            hoveredEvent && hoveredEvent.flamechartNode === nodes[j];

          const width = durationToWidth((end - start) / 1000, state);
          if (width <= 0) {
            return; // Too small to render at this zoom level
          }

          const x = Math.floor(timestampToPosition(start / 1000, state));
          if (x + width < 0 || canvasWidth < x) {
            continue; // Not in view
          }

          context.fillStyle = showHoverHighlight
            ? COLORS.FLAME_GRAPH_HOVER
            : COLORS.FLAME_GRAPH;

          context.fillRect(
            x,
            y,
            Math.floor(width - REACT_PRIORITY_BORDER_SIZE),
            Math.floor(FLAMECHART_FRAME_HEIGHT - REACT_PRIORITY_BORDER_SIZE)
          );

          if (width > FLAMECHART_TEXT_PADDING * 2) {
            const trimmedName = trimFlamegraphText(
              context,
              name,
              width - FLAMECHART_TEXT_PADDING * 2 + (x < 0 ? x : 0)
            );
            if (trimmedName !== null) {
              context.fillStyle = COLORS.PRIORITY_LABEL;
              context.fillText(
                trimmedName,
                x + FLAMECHART_TEXT_PADDING - (x < 0 ? x : 0),
                y + FLAMECHART_FRAME_HEIGHT / 2
              );
            }
          }
        }
      }
    }

    // LEFT: Priority labels
    // Priority labels do not scroll off screen; they are always rendered at a fixed horizontal position.
    // Render them last, on top of everything else, to account for things scrolled beneath them.
    y = HEADER_HEIGHT_FIXED - offsetY;

    REACT_PRIORITIES.forEach((priority, priorityIndex) => {
      context.fillStyle = COLORS.PRIORITY_BACKGROUND;
      context.fillRect(
        0,
        Math.floor(y),
        Math.floor(LABEL_FIXED_WIDTH),
        REACT_DEVTOOLS_PRIORITY_SIZE
      );

      context.fillStyle = COLORS.PRIORITY_BORDER;
      context.fillRect(
        0,
        Math.floor(y + REACT_DEVTOOLS_PRIORITY_SIZE),
        canvasWidth,
        REACT_PRIORITY_BORDER_SIZE
      );

      context.fillStyle = COLORS.PRIORITY_BORDER;
      context.fillRect(
        Math.floor(LABEL_FIXED_WIDTH) - REACT_PRIORITY_BORDER_SIZE,
        Math.floor(y),
        REACT_PRIORITY_BORDER_SIZE,
        REACT_DEVTOOLS_PRIORITY_SIZE
      );

      context.fillStyle = COLORS.PRIORITY_LABEL;
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.font = `${REACT_DEVTOOLS_FONT_SIZE}px sans-serif`;
      context.fillText(priority, 10, y + REACT_DEVTOOLS_PRIORITY_SIZE / 2);

      y += REACT_DEVTOOLS_PRIORITY_SIZE + REACT_PRIORITY_BORDER_SIZE;
    });

    // TOP: Time markers
    // Time markers do not scroll off screen; they are always rendered at a fixed vertical position.
    // Render them last, on top of everything else, to account for things scrolled beneath them.
    y = 0;

    context.fillStyle = COLORS.BACKGROUND;
    context.fillRect(0, 0, canvasWidth, HEADER_HEIGHT_FIXED);

    context.fillStyle = COLORS.PRIORITY_BORDER;
    context.fillRect(0, MARKER_HEIGHT, canvasWidth, REACT_PRIORITY_BORDER_SIZE);

    // Draw time marker text on top of the priority groupings
    for (
      let i = firstIntervalPosition;
      i < scrollableCanvasWidth;
      i += intervalSize
    ) {
      if (i > 0) {
        const markerTimestamp = positionToTimestamp(
          i + LABEL_FIXED_WIDTH,
          state
        );
        const markerLabel = Math.round(markerTimestamp);

        const x = LABEL_FIXED_WIDTH + i;

        context.fillStyle = COLORS.PRIORITY_BORDER;
        context.fillRect(
          x,
          MARKER_HEIGHT - MARKER_TICK_HEIGHT,
          REACT_PRIORITY_BORDER_SIZE,
          MARKER_TICK_HEIGHT
        );

        context.fillStyle = COLORS.TIME_MARKER_LABEL;
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.font = `${MARKER_FONT_SIZE}px sans-serif`;
        context.fillText(
          `${markerLabel}ms`,
          x - MARKER_TEXT_PADDING,
          MARKER_HEIGHT / 2
        );
      }
    }
  }
);

function App() {
  const [data, setData] = useState<ReactProfilerData | null>(null);
  const [flamechart, setFlamechart] = useState<FlamechartData | null>(null);

  useEffect(() => {
    fetch(JSON_PATH)
      .then(data => data.json())
      .then(data => {
        // Filter null entries and sort by timestamp.
        // I would not expect to have to do either of this,
        // but some of the data being passed in requires it.
        data = data.filter(Boolean).sort((a, b) => (a.ts > b.ts ? 1 : -1));

        if (data.length > 0) {
          unstable_batchedUpdates(() => {
            const processedData = preprocessData(data);
            setData(processedData);

            const flamechart = preprocessFlamechart(data);
            setFlamechart(flamechart);
          });
        }
      });
  }, []);

  return (
    <div className={styles.App} style={{ backgroundColor: COLORS.PAGE_BG }}>
      <AutoSizer>
        {({ height, width }) => (
          <AutoSizedCanvas
            data={data}
            flamechart={flamechart}
            height={height}
            width={width}
          />
        )}
      </AutoSizer>
    </div>
  );
}

function AutoSizedCanvas({ data, flamechart, height, width }) {
  const canvasRef = useRef();

  const state = usePanAndZoom({
    canvasRef,
    canvasHeight: height,
    canvasWidth: width,
    fixedColumnWidth: LABEL_FIXED_WIDTH,
    fixedHeaderHeight: HEADER_HEIGHT_FIXED,
    unscaledContentWidth: data != null ? data.duration : 0,
    unscaledContentHeight:
      data != null
        ? REACT_DEVTOOLS_CANVAS_HEIGHT +
          flamechart.layers.length * FLAMECHART_FRAME_HEIGHT
        : 0,
  });

  const hoveredEvent = getHoveredEvent(data, flamechart, state);

  useLayoutEffect(() => {
    renderCanvas(
      data,
      flamechart,
      canvasRef.current,
      width,
      height,
      state,
      hoveredEvent
    );
  });

  return (
    <Fragment>
      <canvas
        ref={canvasRef}
        className={styles.Canvas}
        height={height}
        width={width}
      />
      <EventTooltip data={data} hoveredEvent={hoveredEvent} state={state} />
    </Fragment>
  );
}

export default App;
