// @flow

import type { TimelineEvent } from './speedscope/import/chrome';
import type { PanAndZoomState } from './usePanAndZoom';

import { copy } from 'clipboard-js';
import React, {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import memoize from 'memoize-one';
import usePanAndZoom, {
  durationToWidth,
  positionToTimestamp,
  timestampToPosition,
} from './usePanAndZoom';
import { getCanvasContext } from './canvasUtils';
import prettyMilliseconds from 'pretty-ms';
import { getBatchRange } from './utils';
import useInteractiveEvents from './useInteractiveEvents';
import EventTooltip from './EventTooltip';
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
import { ContextMenu, ContextMenuItem, useContextMenu } from './context';

import JSON_PATH from 'url:../static/small-devtools.json';
//import JSON_PATH from 'url:../static/initial-render.json';

const CONTEXT_MENU_ID = 'canvas';

import type {
  FlamechartData,
  ReactEvent,
  ReactHoverContextInfo,
  ReactMeasure,
  ReactPriority,
  ReactProfilerData,
} from './types';

type ContextMenuContextData = {|
  data: ReactProfilerData | null,
  flamechart: FlamechartData | null,
  hoveredEvent: ReactHoverContextInfo | null,
  state: PanAndZoomState,
|};

const REACT_PRIORITIES = ['unscheduled', 'high', 'normal', 'low'];

const ROW_CSS_PIXELS_HEIGHT = 16;
const TEXT_CSS_PIXELS_OFFSET_START = 3;
const TEXT_CSS_PIXELS_OFFSET_TOP = 11;
const FONT_SIZE = 10;
const BORDER_OPACITY = 0.4;

const REACT_GUTTER_SIZE = 4;
const REACT_EVENT_SIZE = 6;
const REACT_WORK_SIZE = 12;
const REACT_EVENT_BORDER_SIZE = 1;
const REACT_PRIORITY_BORDER_SIZE = 1;

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

function getHoveredEvent(
  schedulerCanvasHeight: number,
  data: ReactProfilerData | null,
  flamechart: FlamechartData | null,
  state: PanAndZoomState
): ReactHoverContextInfo | null {
  const { canvasMouseX, canvasMouseY, offsetY } = state;

  if (canvasMouseX < LABEL_FIXED_WIDTH || canvasMouseY < HEADER_HEIGHT_FIXED) {
    return null;
  }

  if (canvasMouseY + offsetY < schedulerCanvasHeight) {
    if (data != null) {
      let adjustedCanvasMouseY = canvasMouseY - HEADER_HEIGHT_FIXED + offsetY;
      let priorityMinY = HEADER_HEIGHT_FIXED;
      let priorityIndex = null;
      let priority: ReactPriority = 'unscheduled';
      for (let index = 0; index < REACT_PRIORITIES.length; index++) {
        priority = REACT_PRIORITIES[index];

        const priorityHeight = getPriorityHeight(data, priority);
        if (
          adjustedCanvasMouseY >= priorityMinY &&
          adjustedCanvasMouseY <= priorityMinY + priorityHeight
        ) {
          priorityIndex = index;
          break;
        }
        priorityMinY += priorityHeight;
      }

      if (priorityIndex === null) {
        return null;
      }

      const baseY = priorityMinY - offsetY;
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
        (canvasMouseY + offsetY - HEADER_HEIGHT_FIXED - schedulerCanvasHeight) /
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
  baseY,
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

      y = baseY + REACT_WORK_SIZE * depth + REACT_GUTTER_SIZE * depth - offsetY;

      const lineWidth = Math.floor(REACT_EVENT_BORDER_SIZE);

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
        REACT_WORK_SIZE
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
        y = baseY + REACT_EVENT_SIZE / 2 - offsetY;

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
    data: ReactProfilerData,
    flamechart: FlamechartData | null,
    canvas: HTMLCanvasElement | null,
    canvasWidth: number,
    canvasHeight: number,
    schedulerCanvasHeight: number,
    state: PanAndZoomState,
    hoveredEvent: ReactHoverContextInfo | null
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

      let priorityMinY = HEADER_HEIGHT_FIXED;

      REACT_PRIORITIES.forEach((priority, priorityIndex) => {
        const currentPriority = data[priority];

        let baseY = priorityMinY + REACT_GUTTER_SIZE;

        if (currentPriority.events.length > 0) {
          currentPriority.events.forEach(event => {
            const showHoverHighlight =
              hoveredEvent && hoveredEvent.event === event;
            renderReact({
              baseY,
              canvasWidth,
              context,
              eventOrMeasure: event,
              showGroupHighlight: false,
              showHoverHighlight,
              priorityIndex,
              state,
            });
          });

          // Draw the hovered and/or selected items on top so they stand out.
          // This is helpful if there are multiple (overlapping) items close to each other.
          if (hoveredEvent !== null && hoveredEvent.event !== null) {
            renderReact({
              baseY,
              canvasWidth,
              context,
              eventOrMeasure: hoveredEvent.event,
              showGroupHighlight: false,
              showHoverHighlight: true,
              priorityIndex: hoveredEvent.priorityIndex,
              state,
            });
          }

          baseY += REACT_EVENT_SIZE + REACT_GUTTER_SIZE;
        }

        currentPriority.measures.forEach(measure => {
          const showHoverHighlight =
            hoveredEvent && hoveredEvent.measure === measure;
          const showGroupHighlight =
            hoveredEvent &&
            hoveredEvent.measure !== null &&
            hoveredEvent.measure.batchUID === measure.batchUID;
          renderReact({
            baseY,
            canvasWidth,
            context,
            eventOrMeasure: measure,
            priorityIndex,
            showGroupHighlight,
            showHoverHighlight,
            state,
          });
        });

        priorityMinY += getPriorityHeight(data, priority);
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
            schedulerCanvasHeight +
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
      const priorityHeight = getPriorityHeight(data, priority);

      if (priorityHeight === 0) {
        return;
      }

      context.fillStyle = COLORS.PRIORITY_BACKGROUND;
      context.fillRect(
        0,
        Math.floor(y),
        Math.floor(LABEL_FIXED_WIDTH),
        priorityHeight
      );

      context.fillStyle = COLORS.PRIORITY_BORDER;
      context.fillRect(
        0,
        Math.floor(y + priorityHeight),
        canvasWidth,
        REACT_PRIORITY_BORDER_SIZE
      );

      context.fillStyle = COLORS.PRIORITY_BORDER;
      context.fillRect(
        Math.floor(LABEL_FIXED_WIDTH) - REACT_PRIORITY_BORDER_SIZE,
        Math.floor(y),
        REACT_PRIORITY_BORDER_SIZE,
        priorityHeight
      );

      context.fillStyle = COLORS.PRIORITY_LABEL;
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.font = `${LABEL_FONT_SIZE}px sans-serif`;
      context.fillText(priority, 4, y + priorityHeight / 2);

      y += priorityHeight + REACT_PRIORITY_BORDER_SIZE;
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

const cachedPriorityHeights = new Map();
const getPriorityHeight = (
  data: ReactProfilerData,
  priority: ReactPriority
): number => {
  if (cachedPriorityHeights.has(priority)) {
    // We know the value must be present because we've just checked.
    return ((cachedPriorityHeights.get(priority): any): number);
  } else {
    const numMeasures = data[priority].maxNestedMeasures;
    const events = data[priority].events;

    let priorityHeight = 0;
    if (numMeasures > 0 && events.length > 0) {
      priorityHeight =
        REACT_GUTTER_SIZE +
        REACT_EVENT_SIZE +
        REACT_WORK_SIZE * numMeasures +
        REACT_GUTTER_SIZE * numMeasures +
        REACT_PRIORITY_BORDER_SIZE;
    } else if (numMeasures > 0) {
      priorityHeight =
        REACT_GUTTER_SIZE +
        REACT_WORK_SIZE * numMeasures +
        REACT_GUTTER_SIZE * numMeasures +
        REACT_PRIORITY_BORDER_SIZE;
    } else if (events.length > 0) {
      priorityHeight =
        REACT_GUTTER_SIZE +
        REACT_EVENT_SIZE +
        REACT_GUTTER_SIZE +
        REACT_PRIORITY_BORDER_SIZE;
    }

    cachedPriorityHeights.set(priority, priorityHeight);

    return priorityHeight;
  }
};

function App() {
  const [data, setData] = useState<ReactProfilerData | null>(null);
  const [flamechart, setFlamechart] = useState<FlamechartData | null>(null);
  const [schedulerCanvasHeight, setSchedulerCanvasHeight] = useState<number>(0);

  useEffect(() => {
    fetch(JSON_PATH)
      .then(data => data.json())
      .then((data: TimelineEvent[]) => {
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

            let height = 0;

            REACT_PRIORITIES.forEach(priority => {
              height += getPriorityHeight(processedData, priority);
            });

            setSchedulerCanvasHeight(height);
          });
        }
      });
  }, []);

  return (
    <div className={styles.App} style={{ backgroundColor: COLORS.PAGE_BG }}>
      <AutoSizer>
        {({ height, width }: { height: number, width: number }) => (
          <AutoSizedCanvas
            data={data}
            flamechart={flamechart}
            height={height}
            schedulerCanvasHeight={schedulerCanvasHeight}
            width={width}
          />
        )}
      </AutoSizer>
    </div>
  );
}

const copySummary = (data: ReactProfilerData | null, measure: ReactMeasure) => {
  const { batchUID, duration, priority, timestamp, type } = measure;

  const [startTime, stopTime] = getBatchRange(batchUID, priority, data);

  copy(
    JSON.stringify({
      type,
      timestamp: prettyMilliseconds(timestamp),
      duration: prettyMilliseconds(duration),
      batchDuration: prettyMilliseconds(stopTime - startTime),
    })
  );
};

const zoomToBatch = (
  data: ReactProfilerData | null,
  measure: ReactMeasure,
  state: PanAndZoomState
) => {
  const { zoomTo } = state;
  if (!data || !zoomTo) {
    return;
  }
  const { batchUID, priority } = measure;
  const [startTime, stopTime] = getBatchRange(batchUID, priority, data);
  zoomTo(startTime, stopTime);
};

type AutoSizedCanvasProps = {|
  data: ReactProfilerData | null,
  flamechart: FlamechartData | null,
  height: number,
  schedulerCanvasHeight: number,
  width: number,
|};

function AutoSizedCanvas({
  data,
  flamechart,
  height,
  schedulerCanvasHeight,
  width,
}: AutoSizedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const state = usePanAndZoom({
    canvasRef,
    canvasHeight: height,
    canvasWidth: width,
    fixedColumnWidth: LABEL_FIXED_WIDTH,
    fixedHeaderHeight: HEADER_HEIGHT_FIXED,
    unscaledContentWidth: data != null ? data.duration : 0,
    unscaledContentHeight:
      data != null
        ? schedulerCanvasHeight +
          flamechart.layers.length * FLAMECHART_FRAME_HEIGHT
        : 0,
  });

  const hoveredEvent = getHoveredEvent(
    schedulerCanvasHeight,
    data,
    flamechart,
    state
  );
  const [isContextMenuShown, setIsContextMenuShown] = useState<boolean>(false);

  useContextMenu<ContextMenuContextData>({
    data: {
      data,
      flamechart,
      hoveredEvent,
      state,
    },
    id: CONTEXT_MENU_ID,
    onChange: setIsContextMenuShown,
    ref: canvasRef,
  });

  useLayoutEffect(() => {
    if (data !== null) {
      renderCanvas(
        data,
        flamechart,
        canvasRef.current,
        width,
        height,
        schedulerCanvasHeight,
        state,
        hoveredEvent
      );
    }
  });

  return (
    <Fragment>
      <canvas
        ref={canvasRef}
        className={styles.Canvas}
        height={height}
        width={width}
      />
      <ContextMenu id={CONTEXT_MENU_ID}>
        {({ data, hoveredEvent }: ContextMenuContextData) => {
          if (hoveredEvent == null) {
            return null;
          }
          const { event, flamechartNode, measure } = hoveredEvent;
          return (
            <Fragment>
              {event !== null && (
                <ContextMenuItem
                  onClick={() => copy(event.componentName)}
                  title="Copy component name"
                >
                  Copy component name
                </ContextMenuItem>
              )}
              {event !== null && (
                <ContextMenuItem
                  onClick={() => copy(event.componentStack)}
                  title="Copy component stack"
                >
                  Copy component stack
                </ContextMenuItem>
              )}
              {measure !== null && (
                <ContextMenuItem
                  onClick={() => zoomToBatch(data, measure, state)}
                  title="Zoom to batch"
                >
                  Zoom to batch
                </ContextMenuItem>
              )}
              {measure !== null && (
                <ContextMenuItem
                  onClick={() => copySummary(data, measure)}
                  title="Copy summary"
                >
                  Copy summary
                </ContextMenuItem>
              )}
              {flamechartNode !== null && (
                <ContextMenuItem
                  onClick={() => copy(flamechartNode.node.frame.file)}
                  title="Copy file path"
                >
                  Copy file path
                </ContextMenuItem>
              )}
              {flamechartNode !== null && (
                <ContextMenuItem
                  onClick={() =>
                    copy(
                      `line ${flamechartNode.node.frame.line}, column ${flamechartNode.node.frame.col}`
                    )
                  }
                  title="Copy location"
                >
                  Copy location
                </ContextMenuItem>
              )}
            </Fragment>
          );
        }}
      </ContextMenu>
      {!isContextMenuShown && (
        <EventTooltip data={data} hoveredEvent={hoveredEvent} state={state} />
      )}
    </Fragment>
  );
}

export default App;
