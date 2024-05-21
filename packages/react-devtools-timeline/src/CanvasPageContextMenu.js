/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useMemo} from 'react';
import {copy} from 'clipboard-js';
import prettyMilliseconds from 'pretty-ms';

import ContextMenuContainer from 'react-devtools-shared/src/devtools/ContextMenu/ContextMenuContainer';

import {getBatchRange} from './utils/getBatchRange';
import {moveStateToRange} from './view-base/utils/scrollState';
import {MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL} from './view-base/constants';

import type {
  ContextMenuItem,
  ContextMenuRef,
} from 'react-devtools-shared/src/devtools/ContextMenu/types';
import type {
  ReactEventInfo,
  ReactMeasure,
  TimelineData,
  ViewState,
} from './types';

function zoomToBatch(
  data: TimelineData,
  measure: ReactMeasure,
  viewState: ViewState,
  width: number,
) {
  const {batchUID} = measure;
  const [rangeStart, rangeEnd] = getBatchRange(batchUID, data);

  // Convert from time range to ScrollState
  const scrollState = moveStateToRange({
    state: viewState.horizontalScrollState,
    rangeStart,
    rangeEnd,
    contentLength: data.duration,

    minContentLength: data.duration * MIN_ZOOM_LEVEL,
    maxContentLength: data.duration * MAX_ZOOM_LEVEL,
    containerLength: width,
  });

  viewState.updateHorizontalScrollState(scrollState);
}

function copySummary(data: TimelineData, measure: ReactMeasure) {
  const {batchUID, duration, timestamp, type} = measure;

  const [startTime, stopTime] = getBatchRange(batchUID, data);

  copy(
    JSON.stringify({
      type,
      timestamp: prettyMilliseconds(timestamp),
      duration: prettyMilliseconds(duration),
      batchDuration: prettyMilliseconds(stopTime - startTime),
    }),
  );
}

type Props = {
  canvasRef: {current: HTMLCanvasElement | null},
  hoveredEvent: ReactEventInfo | null,
  timelineData: TimelineData,
  viewState: ViewState,
  canvasWidth: number,
  closedMenuStub: React.Node,
  ref: ContextMenuRef,
};

export default function CanvasPageContextMenu({
  canvasRef,
  timelineData,
  hoveredEvent,
  viewState,
  canvasWidth,
  closedMenuStub,
  ref,
}: Props): React.Node {
  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (hoveredEvent == null) {
      return [];
    }

    const {
      componentMeasure,
      flamechartStackFrame,
      measure,
      networkMeasure,
      schedulingEvent,
      suspenseEvent,
    } = hoveredEvent;
    const items: ContextMenuItem[] = [];

    if (componentMeasure != null) {
      items.push({
        onClick: () => copy(componentMeasure.componentName),
        content: 'Copy component name',
      });
    }

    if (networkMeasure != null) {
      items.push({
        onClick: () => copy(networkMeasure.url),
        content: 'Copy URL',
      });
    }

    if (schedulingEvent != null) {
      items.push({
        onClick: () => copy(schedulingEvent.componentName),
        content: 'Copy component name',
      });
    }

    if (suspenseEvent != null) {
      items.push({
        onClick: () => copy(suspenseEvent.componentName),
        content: 'Copy component name',
      });
    }

    if (measure != null) {
      items.push(
        {
          onClick: () =>
            zoomToBatch(timelineData, measure, viewState, canvasWidth),
          content: 'Zoom to batch',
        },
        {
          onClick: () => copySummary(timelineData, measure),
          content: 'Copy summary',
        },
      );
    }

    if (flamechartStackFrame != null) {
      items.push(
        {
          onClick: () => copy(flamechartStackFrame.scriptUrl),
          content: 'Copy file path',
        },
        {
          onClick: () =>
            copy(
              `line ${flamechartStackFrame.locationLine ?? ''}, column ${
                flamechartStackFrame.locationColumn ?? ''
              }`,
            ),
          content: 'Copy location',
        },
      );
    }

    return items;
  }, [hoveredEvent, viewState, canvasWidth]);

  return (
    <ContextMenuContainer
      anchorElementRef={canvasRef}
      items={menuItems}
      closedMenuStub={closedMenuStub}
      ref={ref}
    />
  );
}
