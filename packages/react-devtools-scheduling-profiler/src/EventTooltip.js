/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Point} from './view-base';
import type {
  FlamechartStackFrame,
  NativeEvent,
  ReactComponentMeasure,
  ReactHoverContextInfo,
  ReactMeasure,
  ReactProfilerData,
  Return,
  SchedulingEvent,
  SuspenseEvent,
  UserTimingMark,
} from './types';

import * as React from 'react';
import {useRef} from 'react';
import {formatDuration, formatTimestamp, trimString} from './utils/formatting';
import {getBatchRange} from './utils/getBatchRange';
import useSmartTooltip from './utils/useSmartTooltip';
import styles from './EventTooltip.css';

type Props = {|
  canvasRef: {|current: HTMLCanvasElement | null|},
  data: ReactProfilerData,
  hoveredEvent: ReactHoverContextInfo | null,
  origin: Point,
|};

function getSchedulingEventLabel(event: SchedulingEvent): string | null {
  switch (event.type) {
    case 'schedule-render':
      return 'render scheduled';
    case 'schedule-state-update':
      return 'state update scheduled';
    case 'schedule-force-update':
      return 'force update scheduled';
    default:
      return null;
  }
}

function getReactMeasureLabel(type): string | null {
  switch (type) {
    case 'commit':
      return 'react commit';
    case 'render-idle':
      return 'react idle';
    case 'render':
      return 'react render';
    case 'layout-effects':
      return 'react layout effects';
    case 'passive-effects':
      return 'react passive effects';
    default:
      return null;
  }
}

export default function EventTooltip({
  canvasRef,
  data,
  hoveredEvent,
  origin,
}: Props) {
  const tooltipRef = useSmartTooltip({
    canvasRef,
    mouseX: origin.x,
    mouseY: origin.y,
  });

  if (hoveredEvent === null) {
    return null;
  }

  const {
    componentMeasure,
    flamechartStackFrame,
    measure,
    nativeEvent,
    schedulingEvent,
    suspenseEvent,
    userTimingMark,
  } = hoveredEvent;

  if (componentMeasure !== null) {
    return (
      <TooltipReactComponentMeasure
        componentMeasure={componentMeasure}
        tooltipRef={tooltipRef}
      />
    );
  } else if (nativeEvent !== null) {
    return (
      <TooltipNativeEvent nativeEvent={nativeEvent} tooltipRef={tooltipRef} />
    );
  } else if (schedulingEvent !== null) {
    return (
      <TooltipSchedulingEvent
        data={data}
        schedulingEvent={schedulingEvent}
        tooltipRef={tooltipRef}
      />
    );
  } else if (suspenseEvent !== null) {
    return (
      <TooltipSuspenseEvent
        suspenseEvent={suspenseEvent}
        tooltipRef={tooltipRef}
      />
    );
  } else if (measure !== null) {
    return (
      <TooltipReactMeasure
        data={data}
        measure={measure}
        tooltipRef={tooltipRef}
      />
    );
  } else if (flamechartStackFrame !== null) {
    return (
      <TooltipFlamechartNode
        stackFrame={flamechartStackFrame}
        tooltipRef={tooltipRef}
      />
    );
  } else if (userTimingMark !== null) {
    return (
      <TooltipUserTimingMark mark={userTimingMark} tooltipRef={tooltipRef} />
    );
  }
  return null;
}

const TooltipReactComponentMeasure = ({
  componentMeasure,
  tooltipRef,
}: {
  componentMeasure: ReactComponentMeasure,
  tooltipRef: Return<typeof useRef>,
}) => {
  const {componentName, duration, timestamp, warning} = componentMeasure;

  const label = `${componentName} rendered`;

  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      <div className={styles.TooltipSection}>
        {trimString(label, 768)}
        <div className={styles.Divider} />
        <div className={styles.DetailsGrid}>
          <div className={styles.DetailsGridLabel}>Timestamp:</div>
          <div>{formatTimestamp(timestamp)}</div>
          <div className={styles.DetailsGridLabel}>Duration:</div>
          <div>{formatDuration(duration)}</div>
        </div>
      </div>
      {warning !== null && (
        <div className={styles.TooltipWarningSection}>
          <div className={styles.WarningText}>{warning}</div>
        </div>
      )}
    </div>
  );
};

const TooltipFlamechartNode = ({
  stackFrame,
  tooltipRef,
}: {
  stackFrame: FlamechartStackFrame,
  tooltipRef: Return<typeof useRef>,
}) => {
  const {name, timestamp, duration, locationLine, locationColumn} = stackFrame;
  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      <div className={styles.TooltipSection}>
        <span className={styles.FlamechartStackFrameName}>{name}</span>
        <div className={styles.DetailsGrid}>
          <div className={styles.DetailsGridLabel}>Timestamp:</div>
          <div>{formatTimestamp(timestamp)}</div>
          <div className={styles.DetailsGridLabel}>Duration:</div>
          <div>{formatDuration(duration)}</div>
          {(locationLine !== undefined || locationColumn !== undefined) && (
            <>
              <div className={styles.DetailsGridLabel}>Location:</div>
              <div>
                line {locationLine}, column {locationColumn}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const TooltipNativeEvent = ({
  nativeEvent,
  tooltipRef,
}: {
  nativeEvent: NativeEvent,
  tooltipRef: Return<typeof useRef>,
}) => {
  const {duration, timestamp, type, warning} = nativeEvent;

  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      <div className={styles.TooltipSection}>
        <span className={styles.NativeEventName}>{trimString(type, 768)}</span>
        event
        <div className={styles.Divider} />
        <div className={styles.DetailsGrid}>
          <div className={styles.DetailsGridLabel}>Timestamp:</div>
          <div>{formatTimestamp(timestamp)}</div>
          <div className={styles.DetailsGridLabel}>Duration:</div>
          <div>{formatDuration(duration)}</div>
        </div>
      </div>
      {warning !== null && (
        <div className={styles.TooltipWarningSection}>
          <div className={styles.WarningText}>{warning}</div>
        </div>
      )}
    </div>
  );
};

const TooltipSchedulingEvent = ({
  data,
  schedulingEvent,
  tooltipRef,
}: {
  data: ReactProfilerData,
  schedulingEvent: SchedulingEvent,
  tooltipRef: Return<typeof useRef>,
}) => {
  const label = getSchedulingEventLabel(schedulingEvent);
  if (!label) {
    if (__DEV__) {
      console.warn(
        'Unexpected schedulingEvent type "%s"',
        schedulingEvent.type,
      );
    }
    return null;
  }

  let laneLabels = null;
  let lanes = null;
  switch (schedulingEvent.type) {
    case 'schedule-render':
    case 'schedule-state-update':
    case 'schedule-force-update':
      lanes = schedulingEvent.lanes;
      laneLabels = lanes.map(
        lane => ((data.laneToLabelMap.get(lane): any): string),
      );
      break;
  }

  const {componentName, timestamp, warning} = schedulingEvent;

  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      <div className={styles.TooltipSection}>
        {componentName && (
          <span className={styles.ComponentName}>
            {trimString(componentName, 100)}
          </span>
        )}
        {label}
        <div className={styles.Divider} />
        <div className={styles.DetailsGrid}>
          {laneLabels !== null && lanes !== null && (
            <>
              <div className={styles.DetailsGridLabel}>Lanes:</div>
              <div>
                {laneLabels.join(', ')} ({lanes.join(', ')})
              </div>
            </>
          )}
          <div className={styles.DetailsGridLabel}>Timestamp:</div>
          <div>{formatTimestamp(timestamp)}</div>
        </div>
      </div>
      {warning !== null && (
        <div className={styles.TooltipWarningSection}>
          <div className={styles.WarningText}>{warning}</div>
        </div>
      )}
    </div>
  );
};

const TooltipSuspenseEvent = ({
  suspenseEvent,
  tooltipRef,
}: {
  suspenseEvent: SuspenseEvent,
  tooltipRef: Return<typeof useRef>,
}) => {
  const {
    componentName,
    duration,
    phase,
    resolution,
    timestamp,
    warning,
  } = suspenseEvent;

  let label = 'suspended';
  if (phase !== null) {
    label += ` during ${phase}`;
  }

  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      <div className={styles.TooltipSection}>
        {componentName && (
          <span className={styles.ComponentName}>
            {trimString(componentName, 100)}
          </span>
        )}
        {label}
        <div className={styles.Divider} />
        <div className={styles.DetailsGrid}>
          <div className={styles.DetailsGridLabel}>Status:</div>
          <div>{resolution}</div>
          <div className={styles.DetailsGridLabel}>Timestamp:</div>
          <div>{formatTimestamp(timestamp)}</div>
          {duration !== null && (
            <>
              <div className={styles.DetailsGridLabel}>Duration:</div>
              <div>{formatDuration(duration)}</div>
            </>
          )}
        </div>
      </div>
      {warning !== null && (
        <div className={styles.TooltipWarningSection}>
          <div className={styles.WarningText}>{warning}</div>
        </div>
      )}
    </div>
  );
};

const TooltipReactMeasure = ({
  data,
  measure,
  tooltipRef,
}: {
  data: ReactProfilerData,
  measure: ReactMeasure,
  tooltipRef: Return<typeof useRef>,
}) => {
  const label = getReactMeasureLabel(measure.type);
  if (!label) {
    if (__DEV__) {
      console.warn('Unexpected measure type "%s"', measure.type);
    }
    return null;
  }

  const {batchUID, duration, timestamp, lanes} = measure;
  const [startTime, stopTime] = getBatchRange(batchUID, data);

  const laneLabels = lanes.map(
    lane => ((data.laneToLabelMap.get(lane): any): string),
  );

  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      <div className={styles.TooltipSection}>
        <span className={styles.ReactMeasureLabel}>{label}</span>
        <div className={styles.Divider} />
        <div className={styles.DetailsGrid}>
          <div className={styles.DetailsGridLabel}>Timestamp:</div>
          <div>{formatTimestamp(timestamp)}</div>
          {measure.type !== 'render-idle' && (
            <>
              <div className={styles.DetailsGridLabel}>Duration:</div>
              <div>{formatDuration(duration)}</div>
            </>
          )}
          <div className={styles.DetailsGridLabel}>Batch duration:</div>
          <div>{formatDuration(stopTime - startTime)}</div>
          <div className={styles.DetailsGridLabel}>
            Lane{lanes.length === 1 ? '' : 's'}:
          </div>
          <div>
            {laneLabels.length > 0
              ? `${laneLabels.join(', ')} (${lanes.join(', ')})`
              : lanes.join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
};

const TooltipUserTimingMark = ({
  mark,
  tooltipRef,
}: {
  mark: UserTimingMark,
  tooltipRef: Return<typeof useRef>,
}) => {
  const {name, timestamp} = mark;
  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      <div className={styles.TooltipSection}>
        <span className={styles.UserTimingLabel}>{name}</span>
        <div className={styles.Divider} />
        <div className={styles.DetailsGrid}>
          <div className={styles.DetailsGridLabel}>Timestamp:</div>
          <div>{formatTimestamp(timestamp)}</div>
        </div>
      </div>
    </div>
  );
};
