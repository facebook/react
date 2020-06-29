// @flow

import type {
  ReactProfilerData,
  FlamechartData,
  ReactHoverContextInfo,
} from '../types';
import type {PanAndZoomState} from '../util/usePanAndZoom';

import memoize from 'memoize-one';

import {
  durationToWidth,
  positionToTimestamp,
  timestampToPosition,
} from '../util/usePanAndZoom';

import {
  getCanvasContext,
  getTimeTickInterval,
  trimFlamegraphText,
  getPriorityHeight,
} from './canvasUtils';

import {
  COLORS,
  EVENT_SIZE,
  LABEL_FONT_SIZE,
  MARKER_FONT_SIZE,
  MARKER_TEXT_PADDING,
  MARKER_HEIGHT,
  MARKER_TICK_HEIGHT,
  REACT_PRIORITIES,
  REACT_GUTTER_SIZE,
  REACT_EVENT_SIZE,
  REACT_WORK_SIZE,
  REACT_PRIORITY_BORDER_SIZE,
  FLAMECHART_FONT_SIZE,
  FLAMECHART_FRAME_HEIGHT,
  FLAMECHART_TEXT_PADDING,
  LABEL_FIXED_WIDTH,
  HEADER_HEIGHT_FIXED,
} from './constants';

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
  const {timestamp, type} = eventOrMeasure;
  const {offsetY} = state;

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
      const {depth, duration} = ((eventOrMeasure: any): ReactMeasure);

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
        REACT_WORK_SIZE,
      );
      break;
    case 'schedule-render':
    case 'schedule-state-update':
    case 'suspend':
      const {isCascading} = ((eventOrMeasure: any): ReactEvent);

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

// TODO Passing "state" directly breaks memoization for e.g. mouse moves
export const renderCanvas = memoize(
  (
    data: ReactProfilerData,
    flamechart: FlamechartData | null,
    canvas: HTMLCanvasElement | null,
    canvasWidth: number,
    canvasHeight: number,
    schedulerCanvasHeight: number,
    state: PanAndZoomState,
    hoveredEvent: ReactHoverContextInfo | null,
  ) => {
    const {offsetX, offsetY, zoomLevel} = state;

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

        const layerY = Math.floor(
          HEADER_HEIGHT_FIXED +
            schedulerCanvasHeight +
            i * FLAMECHART_FRAME_HEIGHT -
            offsetY,
        );
        if (
          layerY + FLAMECHART_FRAME_HEIGHT < HEADER_HEIGHT_FIXED ||
          canvasHeight < layerY
        ) {
          continue; // Not in view
        }

        for (let j = 0; j < nodes.length; j++) {
          const {end, node, start} = nodes[j];
          const {name} = node.frame;

          const showHoverHighlight =
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
            layerY,
            Math.floor(width - REACT_PRIORITY_BORDER_SIZE),
            Math.floor(FLAMECHART_FRAME_HEIGHT - REACT_PRIORITY_BORDER_SIZE),
          );

          if (width > FLAMECHART_TEXT_PADDING * 2) {
            const trimmedName = trimFlamegraphText(
              context,
              name,
              width - FLAMECHART_TEXT_PADDING * 2 + (x < 0 ? x : 0),
            );
            if (trimmedName !== null) {
              context.fillStyle = COLORS.PRIORITY_LABEL;
              context.fillText(
                trimmedName,
                x + FLAMECHART_TEXT_PADDING - (x < 0 ? x : 0),
                layerY + FLAMECHART_FRAME_HEIGHT / 2,
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
        priorityHeight,
      );

      context.fillStyle = COLORS.PRIORITY_BORDER;
      context.fillRect(
        0,
        Math.floor(y + priorityHeight),
        canvasWidth,
        REACT_PRIORITY_BORDER_SIZE,
      );

      context.fillStyle = COLORS.PRIORITY_BORDER;
      context.fillRect(
        Math.floor(LABEL_FIXED_WIDTH) - REACT_PRIORITY_BORDER_SIZE,
        Math.floor(y),
        REACT_PRIORITY_BORDER_SIZE,
        priorityHeight,
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
          state,
        );
        const markerLabel = Math.round(markerTimestamp);

        const x = LABEL_FIXED_WIDTH + i;

        context.fillStyle = COLORS.PRIORITY_BORDER;
        context.fillRect(
          x,
          MARKER_HEIGHT - MARKER_TICK_HEIGHT,
          REACT_PRIORITY_BORDER_SIZE,
          MARKER_TICK_HEIGHT,
        );

        context.fillStyle = COLORS.TIME_MARKER_LABEL;
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.font = `${MARKER_FONT_SIZE}px sans-serif`;
        context.fillText(
          `${markerLabel}ms`,
          x - MARKER_TEXT_PADDING,
          MARKER_HEIGHT / 2,
        );
      }
    }
  },
);
