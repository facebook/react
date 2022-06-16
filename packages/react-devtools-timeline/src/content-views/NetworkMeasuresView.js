/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {NetworkMeasure, TimelineData} from '../types';
import type {
  Interaction,
  IntrinsicSize,
  MouseMoveInteraction,
  Rect,
  ViewRefs,
} from '../view-base';

import {
  durationToWidth,
  positioningScaleFactor,
  positionToTimestamp,
  timestampToPosition,
} from './utils/positioning';
import {drawText} from './utils/text';
import {formatDuration} from '../utils/formatting';
import {
  View,
  Surface,
  rectContainsPoint,
  rectIntersectsRect,
  intersectionOfRects,
} from '../view-base';
import {BORDER_SIZE, COLORS, SUSPENSE_EVENT_HEIGHT} from './constants';

const HEIGHT = SUSPENSE_EVENT_HEIGHT; // TODO Constant name
const ROW_WITH_BORDER_HEIGHT = HEIGHT + BORDER_SIZE;

const BASE_URL_REGEX = /([^:]+:\/\/[^\/]+)/;

export class NetworkMeasuresView extends View {
  _depthToNetworkMeasure: Map<number, NetworkMeasure[]>;
  _hoveredNetworkMeasure: NetworkMeasure | null = null;
  _intrinsicSize: IntrinsicSize;
  _maxDepth: number = 0;
  _profilerData: TimelineData;

  onHover: ((event: NetworkMeasure | null) => void) | null = null;

  constructor(surface: Surface, frame: Rect, profilerData: TimelineData) {
    super(surface, frame);

    this._profilerData = profilerData;

    this._performPreflightComputations();
  }

  _performPreflightComputations() {
    this._depthToNetworkMeasure = new Map();

    const {duration, networkMeasures} = this._profilerData;

    networkMeasures.forEach(event => {
      const depth = event.depth;

      this._maxDepth = Math.max(this._maxDepth, depth);

      if (!this._depthToNetworkMeasure.has(depth)) {
        this._depthToNetworkMeasure.set(depth, [event]);
      } else {
        // $FlowFixMe This is unnecessary.
        this._depthToNetworkMeasure.get(depth).push(event);
      }
    });

    this._intrinsicSize = {
      width: duration,
      height: (this._maxDepth + 1) * ROW_WITH_BORDER_HEIGHT,
      // Collapsed by default
      maxInitialHeight: 0,
    };
  }

  desiredSize() {
    return this._intrinsicSize;
  }

  setHoveredEvent(networkMeasure: NetworkMeasure | null) {
    if (this._hoveredNetworkMeasure === networkMeasure) {
      return;
    }
    this._hoveredNetworkMeasure = networkMeasure;
    this.setNeedsDisplay();
  }

  /**
   * Draw a single `NetworkMeasure` as a box/span with text inside of it.
   */
  _drawSingleNetworkMeasure(
    context: CanvasRenderingContext2D,
    networkMeasure: NetworkMeasure,
    baseY: number,
    scaleFactor: number,
    showHoverHighlight: boolean,
  ) {
    const {frame, visibleArea} = this;
    const {
      depth,
      finishTimestamp,
      firstReceivedDataTimestamp,
      lastReceivedDataTimestamp,
      receiveResponseTimestamp,
      sendRequestTimestamp,
      url,
    } = networkMeasure;

    // Account for requests that did not complete while we were profiling.
    // As well as requests that did not receive data before finish (cached?).
    const duration = this._profilerData.duration;
    const timestampBegin = sendRequestTimestamp;
    const timestampEnd =
      finishTimestamp || lastReceivedDataTimestamp || duration;
    const timestampMiddle =
      receiveResponseTimestamp || firstReceivedDataTimestamp || timestampEnd;

    // Convert all timestamps to x coordinates.
    const xStart = timestampToPosition(timestampBegin, scaleFactor, frame);
    const xMiddle = timestampToPosition(timestampMiddle, scaleFactor, frame);
    const xStop = timestampToPosition(timestampEnd, scaleFactor, frame);

    const width = durationToWidth(xStop - xStart, scaleFactor);
    if (width < 1) {
      return; // Too small to render at this zoom level
    }

    baseY += depth * ROW_WITH_BORDER_HEIGHT;

    const outerRect: Rect = {
      origin: {
        x: xStart,
        y: baseY,
      },
      size: {
        width: xStop - xStart,
        height: HEIGHT,
      },
    };
    if (!rectIntersectsRect(outerRect, visibleArea)) {
      return; // Not in view
    }

    // Draw the secondary rect first (since it also shows as a thin border around the primary rect).
    let rect = {
      origin: {
        x: xStart,
        y: baseY,
      },
      size: {
        width: xStop - xStart,
        height: HEIGHT,
      },
    };
    if (rectIntersectsRect(rect, visibleArea)) {
      context.beginPath();
      context.fillStyle =
        this._hoveredNetworkMeasure === networkMeasure
          ? COLORS.NETWORK_SECONDARY_HOVER
          : COLORS.NETWORK_SECONDARY;
      context.fillRect(
        rect.origin.x,
        rect.origin.y,
        rect.size.width,
        rect.size.height,
      );
    }

    rect = {
      origin: {
        x: xStart + BORDER_SIZE,
        y: baseY + BORDER_SIZE,
      },
      size: {
        width: xMiddle - xStart - BORDER_SIZE,
        height: HEIGHT - BORDER_SIZE * 2,
      },
    };
    if (rectIntersectsRect(rect, visibleArea)) {
      context.beginPath();
      context.fillStyle =
        this._hoveredNetworkMeasure === networkMeasure
          ? COLORS.NETWORK_PRIMARY_HOVER
          : COLORS.NETWORK_PRIMARY;
      context.fillRect(
        rect.origin.x,
        rect.origin.y,
        rect.size.width,
        rect.size.height,
      );
    }

    const baseUrl = url.match(BASE_URL_REGEX);
    const displayUrl = baseUrl !== null ? baseUrl[1] : url;

    const durationLabel =
      finishTimestamp !== 0
        ? `${formatDuration(finishTimestamp - sendRequestTimestamp)} - `
        : '';

    const label = durationLabel + displayUrl;

    drawText(label, context, outerRect, visibleArea);
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      _profilerData: {networkMeasures},
      _hoveredNetworkMeasure,
      visibleArea,
    } = this;

    context.fillStyle = COLORS.PRIORITY_BACKGROUND;
    context.fillRect(
      visibleArea.origin.x,
      visibleArea.origin.y,
      visibleArea.size.width,
      visibleArea.size.height,
    );

    const scaleFactor = positioningScaleFactor(
      this._intrinsicSize.width,
      frame,
    );

    networkMeasures.forEach(networkMeasure => {
      this._drawSingleNetworkMeasure(
        context,
        networkMeasure,
        frame.origin.y,
        scaleFactor,
        networkMeasure === _hoveredNetworkMeasure,
      );
    });

    // Render bottom borders.
    for (let i = 0; i <= this._maxDepth; i++) {
      const borderFrame: Rect = {
        origin: {
          x: frame.origin.x,
          y: frame.origin.y + (i + 1) * ROW_WITH_BORDER_HEIGHT - BORDER_SIZE,
        },
        size: {
          width: frame.size.width,
          height: BORDER_SIZE,
        },
      };
      if (rectIntersectsRect(borderFrame, visibleArea)) {
        const borderDrawableRect = intersectionOfRects(
          borderFrame,
          visibleArea,
        );
        context.fillStyle = COLORS.PRIORITY_BORDER;
        context.fillRect(
          borderDrawableRect.origin.x,
          borderDrawableRect.origin.y,
          borderDrawableRect.size.width,
          borderDrawableRect.size.height,
        );
      }
    }
  }

  /**
   * @private
   */
  _handleMouseMove(interaction: MouseMoveInteraction, viewRefs: ViewRefs) {
    const {frame, _intrinsicSize, onHover, visibleArea} = this;
    if (!onHover) {
      return;
    }

    const {location} = interaction.payload;
    if (!rectContainsPoint(location, visibleArea)) {
      onHover(null);
      return;
    }

    const scaleFactor = positioningScaleFactor(_intrinsicSize.width, frame);
    const hoverTimestamp = positionToTimestamp(location.x, scaleFactor, frame);

    const adjustedCanvasMouseY = location.y - frame.origin.y;
    const depth = Math.floor(adjustedCanvasMouseY / ROW_WITH_BORDER_HEIGHT);
    const networkMeasuresAtDepth = this._depthToNetworkMeasure.get(depth);

    const duration = this._profilerData.duration;

    if (networkMeasuresAtDepth) {
      // Find the event being hovered over.
      for (let index = networkMeasuresAtDepth.length - 1; index >= 0; index--) {
        const networkMeasure = networkMeasuresAtDepth[index];
        const {
          finishTimestamp,
          lastReceivedDataTimestamp,
          sendRequestTimestamp,
        } = networkMeasure;

        const timestampBegin = sendRequestTimestamp;
        const timestampEnd =
          finishTimestamp || lastReceivedDataTimestamp || duration;

        if (
          hoverTimestamp >= timestampBegin &&
          hoverTimestamp <= timestampEnd
        ) {
          this.currentCursor = 'context-menu';
          viewRefs.hoveredView = this;
          onHover(networkMeasure);
          return;
        }
      }
    }

    if (viewRefs.hoveredView === this) {
      viewRefs.hoveredView = null;
    }

    onHover(null);
  }

  handleInteraction(interaction: Interaction, viewRefs: ViewRefs) {
    switch (interaction.type) {
      case 'mousemove':
        this._handleMouseMove(interaction, viewRefs);
        break;
    }
  }
}
