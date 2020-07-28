// @flow

import type {Point} from './layout';

import {copy} from 'clipboard-js';
import React, {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

import {
  HorizontalPanAndZoomView,
  VerticalScrollView,
  Surface,
  StaticLayoutView,
  layeredLayout,
  zeroPoint,
  verticallyStackedLayout,
} from './layout';

import prettyMilliseconds from 'pretty-ms';
import {getBatchRange} from './util/getBatchRange';
import EventTooltip from './EventTooltip';
import styles from './CanvasPage.css';
import AutoSizer from 'react-virtualized-auto-sizer';
import {COLORS} from './canvas/constants';

import {ContextMenu, ContextMenuItem, useContextMenu} from './context';

const CONTEXT_MENU_ID = 'canvas';

import type {ReactHoverContextInfo, ReactProfilerData} from './types';
import {useCanvasInteraction} from './useCanvasInteraction';
import {
  FlamechartView,
  ReactEventsView,
  ReactMeasuresView,
  TimeAxisMarkersView,
} from './canvas/views';

type ContextMenuContextData = {|
  data: ReactProfilerData,
  hoveredEvent: ReactHoverContextInfo | null,
|};

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

const copySummary = (data, measure) => {
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

// TODO: Migrate zoomToBatch to new views architecture
// const zoomToBatch = (data, measure, state) => {
//   const {zoomTo} = state;
//   if (!zoomTo) {
//     return;
//   }
//   const {batchUID} = measure;
//   const [startTime, stopTime] = getBatchRange(batchUID, data);
//   zoomTo(startTime, stopTime);
// };

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
  const flamechartViewRef = useRef(null);
  const axisMarkersViewRef = useRef(null);
  const reactEventsViewRef = useRef(null);
  const reactMeasuresViewRef = useRef(null);
  const rootViewRef = useRef(null);

  useLayoutEffect(() => {
    const axisMarkersView = new TimeAxisMarkersView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      data.duration,
    );
    axisMarkersViewRef.current = axisMarkersView;

    const reactEventsView = new ReactEventsView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      data,
    );
    reactEventsViewRef.current = reactEventsView;

    const reactMeasuresView = new ReactMeasuresView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      data,
    );
    reactMeasuresViewRef.current = reactMeasuresView;

    const flamechartView = new FlamechartView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      data.flamechart,
      data,
    );
    flamechartViewRef.current = flamechartView;
    const flamechartVScrollWrapper = new VerticalScrollView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      flamechartView,
      flamechartView.intrinsicSize.height,
    );

    const stackedZoomables = new StaticLayoutView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      verticallyStackedLayout,
      [
        axisMarkersView,
        reactEventsView,
        reactMeasuresView,
        flamechartVScrollWrapper,
      ],
    );

    const contentZoomWrapper = new HorizontalPanAndZoomView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      stackedZoomables,
      flamechartView.intrinsicSize.width,
    );

    rootViewRef.current = new StaticLayoutView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      layeredLayout,
      [contentZoomWrapper],
    );

    surfaceRef.current.rootView = rootViewRef.current;
  }, [data, setHoveredEvent]);

  useLayoutEffect(() => {
    if (canvasRef.current) {
      surfaceRef.current.setCanvas(canvasRef.current, {width, height});
    }
  }, [surfaceRef, canvasRef, width, height]);

  const interactor = useCallback(
    interaction => {
      if (
        hoveredEvent &&
        (hoveredEvent.event ||
          hoveredEvent.measure ||
          hoveredEvent.flamechartStackFrame)
      ) {
        setMouseLocation({
          x: interaction.payload.event.x,
          y: interaction.payload.event.y,
        });
      }
      if (canvasRef.current === null) {
        return;
      }
      surfaceRef.current.handleInteraction(interaction);
      surfaceRef.current.displayIfNeeded();
    },
    [surfaceRef, hoveredEvent, setMouseLocation],
  );

  useCanvasInteraction(canvasRef, interactor);

  useContextMenu<ContextMenuContextData>({
    data: {
      data,
      hoveredEvent,
    },
    id: CONTEXT_MENU_ID,
    onChange: setIsContextMenuShown,
    ref: canvasRef,
  });

  useEffect(() => {
    const {current: reactEventsView} = reactEventsViewRef;
    if (reactEventsView) {
      reactEventsView.onHover = event => {
        if (!hoveredEvent || hoveredEvent.event !== event) {
          setHoveredEvent({
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
      flamechartView.onHover = flamechartStackFrame => {
        if (
          !hoveredEvent ||
          hoveredEvent.flamechartStackFrame !== flamechartStackFrame
        ) {
          setHoveredEvent({
            event: null,
            flamechartStackFrame,
            measure: null,
            data,
          });
        }
      };
    }
  }, [
    reactEventsViewRef,
    reactMeasuresViewRef,
    flamechartViewRef,
    hoveredEvent,
    setHoveredEvent,
  ]);

  useLayoutEffect(() => {
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
      flamechartView.setHoveredFlamechartNode(
        hoveredEvent ? hoveredEvent.flamechartStackFrame : null,
      );
    }
  }, [
    reactEventsViewRef,
    reactMeasuresViewRef,
    flamechartViewRef,
    hoveredEvent,
  ]);

  // When React component renders, rerender surface.
  // TODO: See if displaying on rAF would make more sense since we're somewhat
  // decoupled from React and we don't want to render canvas multiple times per
  // frame.
  useLayoutEffect(() => {
    surfaceRef.current.displayIfNeeded();
  });

  return (
    <Fragment>
      <canvas ref={canvasRef} height={height} width={width} />
      <ContextMenu id={CONTEXT_MENU_ID}>
        {(contextData: ContextMenuContextData) => {
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
              {/* {measure !== null && (
                <ContextMenuItem
                  onClick={() => zoomToBatch(contextData.data, measure, state)}
                  title="Zoom to batch">
                  Zoom to batch
                </ContextMenuItem>
              )} */}
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
                      `line ${flamechartStackFrame.locationLine ||
                        ''}, column ${flamechartStackFrame.locationColumn ||
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
