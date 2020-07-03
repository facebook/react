// @flow

import type {PanAndZoomState} from './util/usePanAndZoom';

import {copy} from 'clipboard-js';
import React, {Fragment, useLayoutEffect, useRef, useState} from 'react';
import usePanAndZoom from './util/usePanAndZoom';

import {getHoveredEvent} from './canvas/canvasUtils';
import {renderCanvas} from './canvas/renderCanvas';

import prettyMilliseconds from 'pretty-ms';
import {getBatchRange} from './util/getBatchRange';
import EventTooltip from './EventTooltip';
import styles from './CanvasPage.css';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  COLORS,
  FLAMECHART_FRAME_HEIGHT,
  LABEL_FIXED_WIDTH,
  HEADER_HEIGHT_FIXED,
} from './canvas/constants';

import {ContextMenu, ContextMenuItem, useContextMenu} from './context';

const CONTEXT_MENU_ID = 'canvas';

import type {
  FlamechartData,
  ReactHoverContextInfo,
  ReactMeasure,
  ReactProfilerData,
  ReactProfilerDataV2,
} from './types';

type ContextMenuContextData = {|
  data: ReactProfilerData,
  flamechart: FlamechartData,
  hoveredEvent: ReactHoverContextInfo | null,
  state: PanAndZoomState,
|};

type Props = {|
  profilerData: ReactProfilerData,
  profilerDataV2: ReactProfilerDataV2,
  flamechart: FlamechartData,
  schedulerCanvasHeight: number,
|};

function CanvasPage({
  profilerData,
  profilerDataV2,
  flamechart,
  schedulerCanvasHeight,
}: Props) {
  return (
    <div
      className={styles.CanvasPage}
      style={{backgroundColor: COLORS.PAGE_BG}}>
      <AutoSizer>
        {({height, width}: {height: number, width: number}) => (
          <AutoSizedCanvas
            data={profilerData}
            dataV2={profilerDataV2}
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

const copySummary = (data: ReactProfilerData, measure: ReactMeasure) => {
  const {batchUID, duration, priority, timestamp, type} = measure;

  const [startTime, stopTime] = getBatchRange(batchUID, priority, data);

  copy(
    JSON.stringify({
      type,
      timestamp: prettyMilliseconds(timestamp),
      duration: prettyMilliseconds(duration),
      batchDuration: prettyMilliseconds(stopTime - startTime),
    }),
  );
};

const zoomToBatch = (
  data: ReactProfilerData,
  measure: ReactMeasure,
  state: PanAndZoomState,
) => {
  const {zoomTo} = state;
  if (!zoomTo) {
    return;
  }
  const {batchUID, priority} = measure;
  const [startTime, stopTime] = getBatchRange(batchUID, priority, data);
  zoomTo(startTime, stopTime);
};

type AutoSizedCanvasProps = {|
  data: ReactProfilerData,
  dataV2: ReactProfilerDataV2,
  flamechart: FlamechartData,
  height: number,
  schedulerCanvasHeight: number,
  width: number,
|};

function AutoSizedCanvas({
  data,
  dataV2,
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
    unscaledContentWidth: dataV2.duration,
    unscaledContentHeight:
      schedulerCanvasHeight +
      flamechart.layers.length * FLAMECHART_FRAME_HEIGHT,
  });

  const hoveredEvent = getHoveredEvent(
    schedulerCanvasHeight,
    data,
    flamechart,
    state,
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
    if (canvasRef.current !== null) {
      renderCanvas(
        dataV2,
        flamechart,
        canvasRef.current,
        width,
        height,
        state,
        hoveredEvent,
      );
    }
  });

  return (
    <Fragment>
      <canvas ref={canvasRef} height={height} width={width} />
      <ContextMenu id={CONTEXT_MENU_ID}>
        {(contextData: ContextMenuContextData) => {
          if (contextData.hoveredEvent == null) {
            return null;
          }
          const {event, flamechartNode, measure} = contextData.hoveredEvent;
          return (
            <Fragment>
              {event !== null && (
                <ContextMenuItem
                  onClick={() => copy(event.componentName)}
                  title="Copy component name">
                  Copy component name
                </ContextMenuItem>
              )}
              {event !== null && (
                <ContextMenuItem
                  onClick={() => copy(event.componentStack)}
                  title="Copy component stack">
                  Copy component stack
                </ContextMenuItem>
              )}
              {measure !== null && (
                <ContextMenuItem
                  onClick={() => zoomToBatch(contextData.data, measure, state)}
                  title="Zoom to batch">
                  Zoom to batch
                </ContextMenuItem>
              )}
              {measure !== null && (
                <ContextMenuItem
                  onClick={() => copySummary(contextData.data, measure)}
                  title="Copy summary">
                  Copy summary
                </ContextMenuItem>
              )}
              {flamechartNode !== null && (
                <ContextMenuItem
                  onClick={() => copy(flamechartNode.node.frame.file)}
                  title="Copy file path">
                  Copy file path
                </ContextMenuItem>
              )}
              {flamechartNode !== null && (
                <ContextMenuItem
                  onClick={() =>
                    copy(
                      `line ${flamechartNode.node.frame.line}, column ${flamechartNode.node.frame.col}`,
                    )
                  }
                  title="Copy location">
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

export default CanvasPage;
