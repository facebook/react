/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Point,
  HorizontalPanAndZoomViewOnChangeCallback,
} from './view-base';
import type {
  ReactHoverContextInfo,
  ReactProfilerData,
  ReactMeasure,
} from './types';

import * as React from 'react';
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {copy} from 'clipboard-js';
import prettyMilliseconds from 'pretty-ms';

import {
  HorizontalPanAndZoomView,
  ResizableSplitView,
  Surface,
  VerticalScrollView,
  View,
  createComposedLayout,
  lastViewTakesUpRemainingSpaceLayout,
  useCanvasInteraction,
  verticallyStackedLayout,
  zeroPoint,
} from './view-base';
import {
  FlamechartView,
  ReactEventsView,
  ReactMeasuresView,
  TimeAxisMarkersView,
  UserTimingMarksView,
} from './content-views';
import {COLORS} from './content-views/constants';

import EventTooltip from './EventTooltip';
import ContextMenu from './context/ContextMenu';
import ContextMenuItem from './context/ContextMenuItem';
import useContextMenu from './context/useContextMenu';
import {getBatchRange} from './utils/getBatchRange';

import styles from './CanvasPage.css';

const CONTEXT_MENU_ID = 'canvas';

type Props = {|
  profilerData: ReactProfilerData,
|};

function CanvasPage({profilerData}: Props) {
  return (
    <div
      className={styles.CanvasPage}
      style={{backgroundColor: COLORS.BACKGROUND}}>
      <AutoSizer>
        {({height, width}: {height: number, width: number}) => (
          <AutoSizedCanvas data={profilerData} height={height} width={width} />
        )}
      </AutoSizer>
    </div>
  );
}

const copySummary = (data: ReactProfilerData, measure: ReactMeasure) => {
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
};

const zoomToBatch = (
  data: ReactProfilerData,
  measure: ReactMeasure,
  syncedHorizontalPanAndZoomViews: HorizontalPanAndZoomView[],
) => {
  const {batchUID} = measure;
  const [startTime, stopTime] = getBatchRange(batchUID, data);
  syncedHorizontalPanAndZoomViews.forEach(syncedView =>
    // Using time as range works because the views' intrinsic content size is
    // based on time.
    syncedView.zoomToRange(startTime, stopTime),
  );
};

type AutoSizedCanvasProps = {|
  data: ReactProfilerData,
  height: number,
  width: number,
|};

function AutoSizedCanvas({data, height, width}: AutoSizedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isContextMenuShown, setIsContextMenuShown] = useState<boolean>(false);
  const [mouseLocation, setMouseLocation] = useState<Point>(zeroPoint); // DOM coordinates
  const [
    hoveredEvent,
    setHoveredEvent,
  ] = useState<ReactHoverContextInfo | null>(null);

  const surfaceRef = useRef(new Surface());
  const userTimingMarksViewRef = useRef(null);
  const reactEventsViewRef = useRef(null);
  const reactMeasuresViewRef = useRef(null);
  const flamechartViewRef = useRef(null);
  const syncedHorizontalPanAndZoomViewsRef = useRef<HorizontalPanAndZoomView[]>(
    [],
  );

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const defaultFrame = {origin: zeroPoint, size: {width, height}};

    // Clear synced views
    syncedHorizontalPanAndZoomViewsRef.current = [];

    const syncAllHorizontalPanAndZoomViewStates: HorizontalPanAndZoomViewOnChangeCallback = (
      newState,
      triggeringView?: HorizontalPanAndZoomView,
    ) => {
      syncedHorizontalPanAndZoomViewsRef.current.forEach(
        syncedView =>
          triggeringView !== syncedView && syncedView.setScrollState(newState),
      );
    };

    // Top content

    const topContentStack = new View(
      surface,
      defaultFrame,
      verticallyStackedLayout,
    );

    const axisMarkersView = new TimeAxisMarkersView(
      surface,
      defaultFrame,
      data.duration,
    );
    topContentStack.addSubview(axisMarkersView);

    if (data.otherUserTimingMarks.length > 0) {
      const userTimingMarksView = new UserTimingMarksView(
        surface,
        defaultFrame,
        data.otherUserTimingMarks,
        data.duration,
      );
      userTimingMarksViewRef.current = userTimingMarksView;
      topContentStack.addSubview(userTimingMarksView);
    }

    const reactEventsView = new ReactEventsView(surface, defaultFrame, data);
    reactEventsViewRef.current = reactEventsView;
    topContentStack.addSubview(reactEventsView);

    const topContentHorizontalPanAndZoomView = new HorizontalPanAndZoomView(
      surface,
      defaultFrame,
      topContentStack,
      data.duration,
      syncAllHorizontalPanAndZoomViewStates,
    );
    syncedHorizontalPanAndZoomViewsRef.current.push(
      topContentHorizontalPanAndZoomView,
    );

    // Resizable content

    const reactMeasuresView = new ReactMeasuresView(
      surface,
      defaultFrame,
      data,
    );
    reactMeasuresViewRef.current = reactMeasuresView;
    const reactMeasuresVerticalScrollView = new VerticalScrollView(
      surface,
      defaultFrame,
      reactMeasuresView,
    );
    const reactMeasuresHorizontalPanAndZoomView = new HorizontalPanAndZoomView(
      surface,
      defaultFrame,
      reactMeasuresVerticalScrollView,
      data.duration,
      syncAllHorizontalPanAndZoomViewStates,
    );
    syncedHorizontalPanAndZoomViewsRef.current.push(
      reactMeasuresHorizontalPanAndZoomView,
    );

    const flamechartView = new FlamechartView(
      surface,
      defaultFrame,
      data.flamechart,
      data.duration,
    );
    flamechartViewRef.current = flamechartView;
    const flamechartVerticalScrollView = new VerticalScrollView(
      surface,
      defaultFrame,
      flamechartView,
    );
    const flamechartHorizontalPanAndZoomView = new HorizontalPanAndZoomView(
      surface,
      defaultFrame,
      flamechartVerticalScrollView,
      data.duration,
      syncAllHorizontalPanAndZoomViewStates,
    );
    syncedHorizontalPanAndZoomViewsRef.current.push(
      flamechartHorizontalPanAndZoomView,
    );

    const resizableContentStack = new ResizableSplitView(
      surface,
      defaultFrame,
      reactMeasuresHorizontalPanAndZoomView,
      flamechartHorizontalPanAndZoomView,
    );

    const rootView = new View(
      surface,
      defaultFrame,
      createComposedLayout(
        verticallyStackedLayout,
        lastViewTakesUpRemainingSpaceLayout,
      ),
    );
    rootView.addSubview(topContentHorizontalPanAndZoomView);
    rootView.addSubview(resizableContentStack);

    surfaceRef.current.rootView = rootView;
  }, [data]);

  useLayoutEffect(() => {
    if (canvasRef.current) {
      surfaceRef.current.setCanvas(canvasRef.current, {width, height});
    }
  }, [width, height]);

  const interactor = useCallback(interaction => {
    if (canvasRef.current === null) {
      return;
    }
    surfaceRef.current.handleInteraction(interaction);
    // Defer drawing to canvas until React's commit phase, to avoid drawing
    // twice and to ensure that both the canvas and DOM elements managed by
    // React are in sync.
    setMouseLocation({
      x: interaction.payload.event.x,
      y: interaction.payload.event.y,
    });
  }, []);

  useCanvasInteraction(canvasRef, interactor);

  useContextMenu({
    data: {
      data,
      hoveredEvent,
    },
    id: CONTEXT_MENU_ID,
    onChange: setIsContextMenuShown,
    ref: canvasRef,
  });

  useEffect(() => {
    const {current: userTimingMarksView} = userTimingMarksViewRef;
    if (userTimingMarksView) {
      userTimingMarksView.onHover = userTimingMark => {
        if (!hoveredEvent || hoveredEvent.userTimingMark !== userTimingMark) {
          setHoveredEvent({
            userTimingMark,
            event: null,
            flamechartStackFrame: null,
            measure: null,
            data,
          });
        }
      };
    }

    const {current: reactEventsView} = reactEventsViewRef;
    if (reactEventsView) {
      reactEventsView.onHover = event => {
        if (!hoveredEvent || hoveredEvent.event !== event) {
          setHoveredEvent({
            userTimingMark: null,
            event,
            flamechartStackFrame: null,
            measure: null,
            data,
          });
        }
      };
    }

    const {current: reactMeasuresView} = reactMeasuresViewRef;
    if (reactMeasuresView) {
      reactMeasuresView.onHover = measure => {
        if (!hoveredEvent || hoveredEvent.measure !== measure) {
          setHoveredEvent({
            userTimingMark: null,
            event: null,
            flamechartStackFrame: null,
            measure,
            data,
          });
        }
      };
    }

    const {current: flamechartView} = flamechartViewRef;
    if (flamechartView) {
      flamechartView.setOnHover(flamechartStackFrame => {
        if (
          !hoveredEvent ||
          hoveredEvent.flamechartStackFrame !== flamechartStackFrame
        ) {
          setHoveredEvent({
            userTimingMark: null,
            event: null,
            flamechartStackFrame,
            measure: null,
            data,
          });
        }
      });
    }
  }, [
    hoveredEvent,
    data, // Attach onHover callbacks when views are re-created on data change
  ]);

  useLayoutEffect(() => {
    const {current: userTimingMarksView} = userTimingMarksViewRef;
    if (userTimingMarksView) {
      userTimingMarksView.setHoveredMark(
        hoveredEvent ? hoveredEvent.userTimingMark : null,
      );
    }

    const {current: reactEventsView} = reactEventsViewRef;
    if (reactEventsView) {
      reactEventsView.setHoveredEvent(hoveredEvent ? hoveredEvent.event : null);
    }

    const {current: reactMeasuresView} = reactMeasuresViewRef;
    if (reactMeasuresView) {
      reactMeasuresView.setHoveredMeasure(
        hoveredEvent ? hoveredEvent.measure : null,
      );
    }

    const {current: flamechartView} = flamechartViewRef;
    if (flamechartView) {
      flamechartView.setHoveredFlamechartStackFrame(
        hoveredEvent ? hoveredEvent.flamechartStackFrame : null,
      );
    }
  }, [hoveredEvent]);

  // Draw to canvas in React's commit phase
  useLayoutEffect(() => {
    surfaceRef.current.displayIfNeeded();
  });

  return (
    <Fragment>
      <canvas ref={canvasRef} height={height} width={width} />
      <ContextMenu id={CONTEXT_MENU_ID}>
        {contextData => {
          if (contextData.hoveredEvent == null) {
            return null;
          }
          const {
            event,
            flamechartStackFrame,
            measure,
          } = contextData.hoveredEvent;
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
                  onClick={() =>
                    zoomToBatch(
                      contextData.data,
                      measure,
                      syncedHorizontalPanAndZoomViewsRef.current,
                    )
                  }
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
              {flamechartStackFrame !== null && (
                <ContextMenuItem
                  onClick={() => copy(flamechartStackFrame.scriptUrl)}
                  title="Copy file path">
                  Copy file path
                </ContextMenuItem>
              )}
              {flamechartStackFrame !== null && (
                <ContextMenuItem
                  onClick={() =>
                    copy(
                      `line ${flamechartStackFrame.locationLine ??
                        ''}, column ${flamechartStackFrame.locationColumn ??
                        ''}`,
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
        <EventTooltip
          data={data}
          hoveredEvent={hoveredEvent}
          origin={mouseLocation}
        />
      )}
    </Fragment>
  );
}

export default CanvasPage;
