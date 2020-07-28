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

import type {
  FlamechartData,
  ReactHoverContextInfo,
  ReactProfilerData,
} from './types';
import {useCanvasInteraction} from './useCanvasInteraction';
import {
  FlamegraphView,
  ReactEventsView,
  ReactMeasuresView,
  TimeAxisMarkersView,
} from './canvas/views';

type ContextMenuContextData = {|
  data: ReactProfilerData,
  flamechart: FlamechartData,
  hoveredEvent: ReactHoverContextInfo | null,
|};

type Props = {|
  profilerData: ReactProfilerData,
  flamechart: FlamechartData,
|};

function CanvasPage({profilerData, flamechart}: Props) {
  return (
    <div
      className={styles.CanvasPage}
      style={{backgroundColor: COLORS.BACKGROUND}}>
      <AutoSizer>
        {({height, width}: {height: number, width: number}) => (
          <AutoSizedCanvas
            data={profilerData}
            flamechart={flamechart}
            height={height}
            width={width}
          />
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
  flamechart: FlamechartData,
  height: number,
  width: number,
|};

function AutoSizedCanvas({
  data,
  flamechart,
  height,
  width,
}: AutoSizedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isContextMenuShown, setIsContextMenuShown] = useState<boolean>(false);
  const [mouseLocation, setMouseLocation] = useState<Point>(zeroPoint); // DOM coordinates
  const [
    hoveredEvent,
    setHoveredEvent,
  ] = useState<ReactHoverContextInfo | null>(null);

  const surfaceRef = useRef(new Surface());
  const flamegraphViewRef = useRef(null);
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

    const flamegraphView = new FlamegraphView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      flamechart,
      data,
    );
    flamegraphViewRef.current = flamegraphView;
    const flamegraphVScrollWrapper = new VerticalScrollView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      flamegraphView,
      flamegraphView.intrinsicSize.height,
    );

    const stackedZoomables = new StaticLayoutView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      verticallyStackedLayout,
      [
        axisMarkersView,
        reactEventsView,
        reactMeasuresView,
        flamegraphVScrollWrapper,
      ],
    );

    const contentZoomWrapper = new HorizontalPanAndZoomView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      stackedZoomables,
      flamegraphView.intrinsicSize.width,
    );

    rootViewRef.current = new StaticLayoutView(
      surfaceRef.current,
      {origin: zeroPoint, size: {width, height}},
      layeredLayout,
      [contentZoomWrapper],
    );

    surfaceRef.current.rootView = rootViewRef.current;
  }, [data, flamechart, setHoveredEvent]);

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
          hoveredEvent.flamechartNode)
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
      flamechart,
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
            flamechartNode: null,
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
            flamechartNode: null,
            measure,
            data,
          });
        }
      };
    }

    const {current: flamegraphView} = flamegraphViewRef;
    if (flamegraphView) {
      flamegraphView.onHover = flamechartNode => {
        if (!hoveredEvent || hoveredEvent.flamechartNode !== flamechartNode) {
          setHoveredEvent({
            event: null,
            flamechartNode,
            measure: null,
            data,
          });
        }
      };
    }
  }, [
    reactEventsViewRef,
    reactMeasuresViewRef,
    flamegraphViewRef,
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

    const {current: flamegraphView} = flamegraphViewRef;
    if (flamegraphView) {
      flamegraphView.setHoveredFlamechartNode(
        hoveredEvent ? hoveredEvent.flamechartNode : null,
      );
    }
  }, [
    reactEventsViewRef,
    reactMeasuresViewRef,
    flamegraphViewRef,
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
                      `line ${flamechartNode.node.frame.line ||
                        ''}, column ${flamechartNode.node.frame.col || ''}`,
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
