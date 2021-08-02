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
  BackgroundColorView,
  HorizontalPanAndZoomView,
  ResizableView,
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
  NativeEventsView,
  ReactMeasuresView,
  SchedulingEventsView,
  SuspenseEventsView,
  TimeAxisMarkersView,
  UserTimingMarksView,
} from './content-views';
import {COLORS} from './content-views/constants';

import EventTooltip from './EventTooltip';
import ContextMenu from 'react-devtools-shared/src/devtools/ContextMenu/ContextMenu';
import ContextMenuItem from 'react-devtools-shared/src/devtools/ContextMenu/ContextMenuItem';
import useContextMenu from 'react-devtools-shared/src/devtools/ContextMenu/useContextMenu';
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

// TODO (scheduling profiler) Why is the "zoom" feature so much slower than normal rendering?
const zoomToBatch = (
  data: ReactProfilerData,
  measure: ReactMeasure,
  syncedHorizontalPanAndZoomViews: HorizontalPanAndZoomView[],
) => {
  const {batchUID} = measure;
  const [startTime, stopTime] = getBatchRange(batchUID, data);
  syncedHorizontalPanAndZoomViews.forEach(syncedView =>
    // Using time as range works because the views' intrinsic content size is based on time.
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
  const nativeEventsViewRef = useRef(null);
  const schedulingEventsViewRef = useRef(null);
  const suspenseEventsViewRef = useRef(null);
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

    function createViewHelper(
      view: View,
      resizeLabel: string = '',
      shouldScrollVertically: boolean = false,
      shouldResizeVertically: boolean = false,
    ): View {
      let verticalScrollView = null;
      if (shouldScrollVertically) {
        verticalScrollView = new VerticalScrollView(
          surface,
          defaultFrame,
          view,
        );
      }

      const horizontalPanAndZoomView = new HorizontalPanAndZoomView(
        surface,
        defaultFrame,
        verticalScrollView !== null ? verticalScrollView : view,
        data.duration,
        syncAllHorizontalPanAndZoomViewStates,
      );

      syncedHorizontalPanAndZoomViewsRef.current.push(horizontalPanAndZoomView);

      let viewToReturn = horizontalPanAndZoomView;
      if (shouldResizeVertically) {
        viewToReturn = new ResizableView(
          surface,
          defaultFrame,
          horizontalPanAndZoomView,
          canvasRef,
          resizeLabel,
        );
      }

      return viewToReturn;
    }

    const axisMarkersView = new TimeAxisMarkersView(
      surface,
      defaultFrame,
      data.duration,
    );
    const axisMarkersViewWrapper = createViewHelper(axisMarkersView);

    let userTimingMarksViewWrapper = null;
    if (data.otherUserTimingMarks.length > 0) {
      const userTimingMarksView = new UserTimingMarksView(
        surface,
        defaultFrame,
        data.otherUserTimingMarks,
        data.duration,
      );
      userTimingMarksViewRef.current = userTimingMarksView;
      userTimingMarksViewWrapper = createViewHelper(userTimingMarksView);
    }

    const nativeEventsView = new NativeEventsView(surface, defaultFrame, data);
    nativeEventsViewRef.current = nativeEventsView;
    const nativeEventsViewWrapper = createViewHelper(
      nativeEventsView,
      'events',
      true,
      true,
    );

    const schedulingEventsView = new SchedulingEventsView(
      surface,
      defaultFrame,
      data,
    );
    schedulingEventsViewRef.current = schedulingEventsView;
    const schedulingEventsViewWrapper = createViewHelper(schedulingEventsView);

    let suspenseEventsViewWrapper = null;
    if (data.suspenseEvents.length > 0) {
      const suspenseEventsView = new SuspenseEventsView(
        surface,
        defaultFrame,
        data,
      );
      suspenseEventsViewRef.current = suspenseEventsView;
      suspenseEventsViewWrapper = createViewHelper(
        suspenseEventsView,
        'suspense',
        true,
        true,
      );
    }

    const reactMeasuresView = new ReactMeasuresView(
      surface,
      defaultFrame,
      data,
    );
    reactMeasuresViewRef.current = reactMeasuresView;
    const reactMeasuresViewWrapper = createViewHelper(
      reactMeasuresView,
      'react',
      true,
      true,
    );

    const flamechartView = new FlamechartView(
      surface,
      defaultFrame,
      data.flamechart,
      data.duration,
    );
    flamechartViewRef.current = flamechartView;
    const flamechartViewWrapper = createViewHelper(
      flamechartView,
      'flamechart',
      true,
      true,
    );

    // Root view contains all of the sub views defined above.
    // The order we add them below determines their vertical position.
    const rootView = new View(
      surface,
      defaultFrame,
      createComposedLayout(
        verticallyStackedLayout,
        lastViewTakesUpRemainingSpaceLayout,
      ),
    );
    rootView.addSubview(axisMarkersViewWrapper);
    if (userTimingMarksViewWrapper !== null) {
      rootView.addSubview(userTimingMarksViewWrapper);
    }
    rootView.addSubview(nativeEventsViewWrapper);
    rootView.addSubview(schedulingEventsViewWrapper);
    if (suspenseEventsViewWrapper !== null) {
      rootView.addSubview(suspenseEventsViewWrapper);
    }
    rootView.addSubview(reactMeasuresViewWrapper);
    rootView.addSubview(flamechartViewWrapper);

    // If subviews are less than the available height, fill remaining height with a solid color.
    rootView.addSubview(new BackgroundColorView(surface, defaultFrame));

    surfaceRef.current.rootView = rootView;
  }, [data]);

  useLayoutEffect(() => {
    if (canvasRef.current) {
      surfaceRef.current.setCanvas(canvasRef.current, {width, height});
    }
  }, [width, height]);

  const interactor = useCallback(interaction => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }

    // Wheel events should always hide the current toolltip.
    switch (interaction.type) {
      case 'wheel-control':
      case 'wheel-meta':
      case 'wheel-plain':
      case 'wheel-shift':
        setHoveredEvent(prevHoverEvent => {
          if (prevHoverEvent === null) {
            return prevHoverEvent;
          } else if (
            prevHoverEvent.flamechartStackFrame !== null ||
            prevHoverEvent.measure !== null ||
            prevHoverEvent.nativeEvent !== null ||
            prevHoverEvent.schedulingEvent !== null ||
            prevHoverEvent.suspenseEvent !== null ||
            prevHoverEvent.userTimingMark !== null
          ) {
            return {
              data: prevHoverEvent.data,
              flamechartStackFrame: null,
              measure: null,
              nativeEvent: null,
              schedulingEvent: null,
              suspenseEvent: null,
              userTimingMark: null,
            };
          } else {
            return prevHoverEvent;
          }
        });
        break;
    }

    const surface = surfaceRef.current;
    surface.handleInteraction(interaction);

    canvas.style.cursor = surface.getCurrentCursor() || 'default';

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
            data,
            flamechartStackFrame: null,
            measure: null,
            nativeEvent: null,
            schedulingEvent: null,
            suspenseEvent: null,
            userTimingMark,
          });
        }
      };
    }

    const {current: nativeEventsView} = nativeEventsViewRef;
    if (nativeEventsView) {
      nativeEventsView.onHover = nativeEvent => {
        if (!hoveredEvent || hoveredEvent.nativeEvent !== nativeEvent) {
          setHoveredEvent({
            data,
            flamechartStackFrame: null,
            measure: null,
            nativeEvent,
            schedulingEvent: null,
            suspenseEvent: null,
            userTimingMark: null,
          });
        }
      };
    }

    const {current: schedulingEventsView} = schedulingEventsViewRef;
    if (schedulingEventsView) {
      schedulingEventsView.onHover = schedulingEvent => {
        if (!hoveredEvent || hoveredEvent.schedulingEvent !== schedulingEvent) {
          setHoveredEvent({
            data,
            flamechartStackFrame: null,
            measure: null,
            nativeEvent: null,
            schedulingEvent,
            suspenseEvent: null,
            userTimingMark: null,
          });
        }
      };
    }

    const {current: suspenseEventsView} = suspenseEventsViewRef;
    if (suspenseEventsView) {
      suspenseEventsView.onHover = suspenseEvent => {
        if (!hoveredEvent || hoveredEvent.suspenseEvent !== suspenseEvent) {
          setHoveredEvent({
            data,
            flamechartStackFrame: null,
            measure: null,
            nativeEvent: null,
            schedulingEvent: null,
            suspenseEvent,
            userTimingMark: null,
          });
        }
      };
    }

    const {current: reactMeasuresView} = reactMeasuresViewRef;
    if (reactMeasuresView) {
      reactMeasuresView.onHover = measure => {
        if (!hoveredEvent || hoveredEvent.measure !== measure) {
          setHoveredEvent({
            data,
            flamechartStackFrame: null,
            measure,
            nativeEvent: null,
            schedulingEvent: null,
            suspenseEvent: null,
            userTimingMark: null,
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
            data,
            flamechartStackFrame,
            measure: null,
            nativeEvent: null,
            schedulingEvent: null,
            suspenseEvent: null,
            userTimingMark: null,
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

    const {current: nativeEventsView} = nativeEventsViewRef;
    if (nativeEventsView) {
      nativeEventsView.setHoveredEvent(
        hoveredEvent ? hoveredEvent.nativeEvent : null,
      );
    }

    const {current: schedulingEventsView} = schedulingEventsViewRef;
    if (schedulingEventsView) {
      schedulingEventsView.setHoveredEvent(
        hoveredEvent ? hoveredEvent.schedulingEvent : null,
      );
    }

    const {current: suspenseEventsView} = suspenseEventsViewRef;
    if (suspenseEventsView) {
      suspenseEventsView.setHoveredEvent(
        hoveredEvent ? hoveredEvent.suspenseEvent : null,
      );
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
            flamechartStackFrame,
            measure,
            schedulingEvent,
            suspenseEvent,
          } = contextData.hoveredEvent;
          return (
            <Fragment>
              {schedulingEvent !== null && (
                <ContextMenuItem
                  onClick={() => copy(schedulingEvent.componentName)}
                  title="Copy component name">
                  Copy component name
                </ContextMenuItem>
              )}
              {suspenseEvent !== null && (
                <ContextMenuItem
                  onClick={() => copy(suspenseEvent.componentName)}
                  title="Copy component name">
                  Copy component name
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
      {!isContextMenuShown && !surfaceRef.current.hasActiveView() && (
        <EventTooltip
          canvasRef={canvasRef}
          data={data}
          hoveredEvent={hoveredEvent}
          origin={mouseLocation}
        />
      )}
    </Fragment>
  );
}

export default CanvasPage;
