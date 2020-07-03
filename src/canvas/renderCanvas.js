// @flow

import type {
  FlamechartData,
  ReactHoverContextInfo,
  ReactLane,
  ReactProfilerDataV2,
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
  getLaneHeight,
} from './canvasUtils';

import {
  COLORS,
  MARKER_FONT_SIZE,
  MARKER_TEXT_PADDING,
  MARKER_HEIGHT,
  MARKER_TICK_HEIGHT,
  REACT_GUTTER_SIZE,
  REACT_WORK_SIZE,
  REACT_PRIORITY_BORDER_SIZE,
  FLAMECHART_FONT_SIZE,
  FLAMECHART_FRAME_HEIGHT,
  FLAMECHART_TEXT_PADDING,
  LABEL_FIXED_WIDTH,
  HEADER_HEIGHT_FIXED,
} from './constants';
import {REACT_TOTAL_NUM_LANES} from '../constants';

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

function renderBackgroundFills(context, canvasWidth, canvasHeight) {
  // Fill the canvas with the background color
  context.fillStyle = COLORS.BACKGROUND;
  context.fillRect(0, 0, canvasWidth, canvasHeight);
}

/**
 * Render all charting data (once it's loaded and processed) within the
 * "scrollable" region.
 */
// TODO (windowing) We can avoid rendering all of this if we've scrolled some of it off screen.
function renderReactMarksAndMeasures(
  context,
  data,
  state,
  hoveredEvent,
  canvasWidth,
  canvasHeight,
  canvasStartY,
): number {
  // TODO: Compute lanes to render from data? Or just use getLaneHeight to skip lanes
  const lanesToRender: ReactLane[] = Array.from(
    Array(REACT_TOTAL_NUM_LANES).keys(),
  );

  let laneMinY = canvasStartY;

  // Render lanes background.
  // TODO: Figure out a way not to compute total height twice
  const schedulerAreaHeight = lanesToRender.reduce(
    (height, lane) => height + getLaneHeight(data, lane),
    0,
  );
  context.fillStyle = COLORS.PRIORITY_BACKGROUND;
  context.fillRect(
    0,
    Math.floor(canvasStartY),
    canvasWidth,
    schedulerAreaHeight,
  );

  lanesToRender.forEach(lane => {
    const baseY = laneMinY + REACT_GUTTER_SIZE;

    // TODO: Draw a separate event gutter. Split into a renderReactMarks function?
    // if (data.events.length > 0) {
    //   data.events.forEach(event => {
    //     const showHoverHighlight = hoveredEvent && hoveredEvent.event === event;
    //     renderSingleReactMarkOrMeasure({
    //       baseY,
    //       canvasWidth,
    //       context,
    //       eventOrMeasure: event,
    //       showGroupHighlight: false,
    //       showHoverHighlight,
    //       state,
    //     });
    //   });

    //   // Draw the hovered and/or selected items on top so they stand out.
    //   // This is helpful if there are multiple (overlapping) items close to each other.
    //   // if (hoveredEvent !== null && hoveredEvent.event !== null) {
    //   //   renderSingleReactMarkOrMeasure({
    //   //     baseY,
    //   //     canvasWidth,
    //   //     context,
    //   //     eventOrMeasure: hoveredEvent.event,
    //   //     showGroupHighlight: false,
    //   //     showHoverHighlight: true,
    //   //     state,
    //   //   });
    //   // }

    //   baseY += REACT_EVENT_SIZE + REACT_GUTTER_SIZE;
    // }

    data.measures
      // TODO: Optimization: precompute this so that we don't filter this array |lanesToRender| times
      .filter(measure => measure.lanes.includes(lane))
      .forEach(measure => {
        const showHoverHighlight =
          hoveredEvent && hoveredEvent.measure === measure;
        const showGroupHighlight =
          hoveredEvent &&
          hoveredEvent.measure &&
          hoveredEvent.measure.batchUID === measure.batchUID;
        renderSingleReactMeasure(
          context,
          state,
          measure,
          canvasWidth,
          baseY,
          showGroupHighlight,
          showHoverHighlight,
        );
      });

    laneMinY += getLaneHeight(data, lane);

    // Render bottom border
    context.fillStyle = COLORS.PRIORITY_BORDER;
    context.fillRect(
      0,
      Math.floor(laneMinY - state.offsetY - REACT_PRIORITY_BORDER_SIZE),
      canvasWidth,
      REACT_PRIORITY_BORDER_SIZE,
    );
  });

  return laneMinY;
}

/**
 * Render a single `ReactMeasure` as a bar in the canvas.
 *
 * @see renderReactMeasures
 */
function renderSingleReactMeasure(
  context,
  state,
  measure,
  canvasWidth,
  baseY,
  showGroupHighlight,
  showHoverHighlight,
) {
  const {timestamp, type, duration} = measure;
  const {offsetY} = state;

  let fillStyle = null;
  let hoveredFillStyle = null;
  let groupSelectedFillStyle = null;

  // We could change the max to 0 and just skip over rendering anything that small,
  // but this has the effect of making the chart look very empty when zoomed out.
  // So long as perf is okay- it might be best to err on the side of showing things.
  const width = durationToWidth(duration, state);
  if (width <= 0) {
    return; // Too small to render at this zoom level
  }

  const x = timestampToPosition(timestamp, state);
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
      throw new Error(`Unexpected measure type "${type}"`);
  }

  const y = baseY - offsetY;

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
}

// function renderSingleReactMarkOrMeasure({
//   baseY,
//   canvasWidth,
//   context,
//   eventOrMeasure,
//   showGroupHighlight,
//   showHoverHighlight,
//   state,
// }) {
//   const {timestamp, type} = eventOrMeasure;
//   const {offsetY} = state;

//   let fillStyle = null;
//   let hoveredFillStyle = null;
//   let groupSelectedFillStyle = null;
//   let x, y, width;

//   switch (type) {
//     case 'commit':
//     case 'render-idle':
//     case 'render':
//     case 'layout-effects':
//     case 'passive-effects':
//       const {depth, duration} = ((eventOrMeasure: any): ReactMeasure);

//       // We could change the max to 0 and just skip over rendering anything that small,
//       // but this has the effect of making the chart look very empty when zoomed out.
//       // So long as perf is okay- it might be best to err on the side of showing things.
//       width = durationToWidth(duration, state);
//       if (width <= 0) {
//         return; // Too small to render at this zoom level
//       }

//       x = timestampToPosition(timestamp, state);
//       if (x + width < 0 || canvasWidth < x) {
//         return; // Not in view
//       }

//       switch (type) {
//         case 'commit':
//           fillStyle = COLORS.REACT_COMMIT;
//           hoveredFillStyle = COLORS.REACT_COMMIT_HOVER;
//           groupSelectedFillStyle = COLORS.REACT_COMMIT_SELECTED;
//           break;
//         case 'render-idle':
//           // We could render idle time as diagonal hashes.
//           // This looks nicer when zoomed in, but not so nice when zoomed out.
//           // color = context.createPattern(getIdlePattern(), 'repeat');
//           fillStyle = COLORS.REACT_IDLE;
//           hoveredFillStyle = COLORS.REACT_IDLE_HOVER;
//           groupSelectedFillStyle = COLORS.REACT_IDLE_SELECTED;
//           break;
//         case 'render':
//           fillStyle = COLORS.REACT_RENDER;
//           hoveredFillStyle = COLORS.REACT_RENDER_HOVER;
//           groupSelectedFillStyle = COLORS.REACT_RENDER_SELECTED;
//           break;
//         case 'layout-effects':
//           fillStyle = COLORS.REACT_LAYOUT_EFFECTS;
//           hoveredFillStyle = COLORS.REACT_LAYOUT_EFFECTS_HOVER;
//           groupSelectedFillStyle = COLORS.REACT_LAYOUT_EFFECTS_SELECTED;
//           break;
//         case 'passive-effects':
//           fillStyle = COLORS.REACT_PASSIVE_EFFECTS;
//           hoveredFillStyle = COLORS.REACT_PASSIVE_EFFECTS_HOVER;
//           groupSelectedFillStyle = COLORS.REACT_PASSIVE_EFFECTS_SELECTED;
//           break;
//         default:
//           console.warn(`Unexpected type "${type}"`);
//           break;
//       }

//       y = baseY + REACT_WORK_SIZE * depth + REACT_GUTTER_SIZE * depth - offsetY;

//       // $FlowFixMe We know these won't be null
//       context.fillStyle = showHoverHighlight
//         ? hoveredFillStyle
//         : showGroupHighlight
//         ? groupSelectedFillStyle
//         : fillStyle;
//       context.fillRect(
//         Math.floor(x),
//         Math.floor(y),
//         Math.floor(width),
//         REACT_WORK_SIZE,
//       );
//       break;
//     case 'schedule-render':
//     case 'schedule-state-update':
//     case 'suspend':
//       const {isCascading} = ((eventOrMeasure: any): ReactEvent);

//       x = timestampToPosition(timestamp, state);
//       if (x + EVENT_SIZE / 2 < 0 || canvasWidth < x) {
//         return; // Not in view
//       }

//       switch (type) {
//         case 'schedule-render':
//         case 'schedule-state-update':
//           if (isCascading) {
//             fillStyle = showHoverHighlight
//               ? COLORS.REACT_SCHEDULE_CASCADING_HOVER
//               : COLORS.REACT_SCHEDULE_CASCADING;
//           } else {
//             fillStyle = showHoverHighlight
//               ? COLORS.REACT_SCHEDULE_HOVER
//               : COLORS.REACT_SCHEDULE;
//           }
//           break;
//         case 'suspend':
//           fillStyle = showHoverHighlight
//             ? COLORS.REACT_SUSPEND_HOVER
//             : COLORS.REACT_SUSPEND;
//           break;
//         default:
//           console.warn(`Unexpected event or measure type "${type}"`);
//           break;
//       }

//       if (fillStyle !== null) {
//         const circumference = REACT_EVENT_SIZE;
//         y = baseY + REACT_EVENT_SIZE / 2 - offsetY;

//         context.beginPath();
//         context.fillStyle = fillStyle;
//         context.arc(x, y, circumference / 2, 0, 2 * Math.PI);
//         context.fill();
//       }
//       break;
//     default:
//       console.warn(`Unexpected event or measure type "${type}"`);
//       break;
//   }
// }

function renderFlamechart(
  context,
  flamechart,
  state,
  hoveredEvent,
  canvasWidth,
  canvasHeight,
  /** y coord on canvas to start painting at */
  canvasStartY,
) {
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.font = `${FLAMECHART_FONT_SIZE}px sans-serif`;

  for (let i = 0; i < flamechart.layers.length; i++) {
    const nodes = flamechart.layers[i];

    const layerY = Math.floor(canvasStartY + i * FLAMECHART_FRAME_HEIGHT);
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

function renderAxisMarkers(
  context,
  state,
  canvasWidth,
  panOffsetX,
  panZoomLevel,
) {
  context.fillStyle = COLORS.BACKGROUND;
  context.fillRect(0, 0, canvasWidth, HEADER_HEIGHT_FIXED);

  context.fillStyle = COLORS.PRIORITY_BORDER;
  context.fillRect(0, MARKER_HEIGHT, canvasWidth, REACT_PRIORITY_BORDER_SIZE);

  // Charting data renders within this region of pixels as "scrollable" content.
  // Time markers (top) and priority labels (left) are fixed content.
  const scrollableCanvasWidth = canvasWidth - LABEL_FIXED_WIDTH;

  const interval = getTimeTickInterval(panZoomLevel);
  const intervalSize = interval * panZoomLevel;
  const firstIntervalPosition =
    0 - panOffsetX + Math.floor(panOffsetX / intervalSize) * intervalSize;

  for (
    let i = firstIntervalPosition;
    i < scrollableCanvasWidth;
    i += intervalSize
  ) {
    if (i > 0) {
      const markerTimestamp = positionToTimestamp(i + LABEL_FIXED_WIDTH, state);
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
}

// TODO Passing "state" directly breaks memoization for e.g. mouse moves
export const renderCanvas = memoize(
  (
    data: $ReadOnly<ReactProfilerDataV2>,
    flamechart: $ReadOnly<FlamechartData>,
    canvas: HTMLCanvasElement,
    canvasWidth: number,
    canvasHeight: number,
    state: $ReadOnly<PanAndZoomState>,
    hoveredEvent: $ReadOnly<ReactHoverContextInfo> | null,
  ) => {
    const {offsetX, offsetY, zoomLevel} = state;

    const context = getCanvasContext(canvas, canvasHeight, canvasWidth, true);

    renderBackgroundFills(context, canvasWidth, canvasHeight);

    const schedulerAreaEndY = renderReactMarksAndMeasures(
      context,
      data,
      state,
      hoveredEvent,
      canvasWidth,
      canvasHeight,
      // Time markers do not scroll off screen; they are always rendered at a
      // fixed vertical position.
      HEADER_HEIGHT_FIXED,
    );

    // Flame graph data renders below the prioritized React data.
    // TODO Timestamp alignment is off by a few hundred me from our user timing marks; why?
    renderFlamechart(
      context,
      flamechart,
      state,
      hoveredEvent,
      canvasWidth,
      canvasHeight,
      schedulerAreaEndY - offsetY,
    );

    // TOP: Time markers
    // Time markers do not scroll off screen; they are always rendered at a fixed vertical position.
    // Render them last, on top of everything else, to account for things scrolled beneath them.
    // Draw time marker text on top of the priority groupings
    renderAxisMarkers(context, state, canvasWidth, offsetX, zoomLevel);
  },
);
