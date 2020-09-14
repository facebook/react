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
  ReactEvent,
  ReactHoverContextInfo,
  ReactMeasure,
  ReactProfilerData,
  Return,
  UserTimingMark,
} from './types';

import * as React from 'react';
import {Fragment, useRef} from 'react';
import prettyMilliseconds from 'pretty-ms';
import {COLORS} from './content-views/constants';
import {getBatchRange} from './utils/getBatchRange';
import useSmartTooltip from './utils/useSmartTooltip';
import styles from './EventTooltip.css';

type Props = {|
  data: ReactProfilerData,
  hoveredEvent: ReactHoverContextInfo | null,
  origin: Point,
|};

function formatTimestamp(ms) {
  return ms.toLocaleString(undefined, {minimumFractionDigits: 2}) + 'ms';
}

function formatDuration(ms) {
  return prettyMilliseconds(ms, {millisecondsDecimalDigits: 3});
}

function trimmedString(string: string, length: number): string {
  if (string.length > length) {
    return `${string.substr(0, length - 1)}…`;
  }
  return string;
}

function getReactEventLabel(type): string | null {
  switch (type) {
    case 'schedule-render':
      return 'render scheduled';
    case 'schedule-state-update':
      return 'state update scheduled';
    case 'schedule-force-update':
      return 'force update scheduled';
    case 'suspense-suspend':
      return 'suspended';
    case 'suspense-resolved':
      return 'suspense resolved';
    case 'suspense-rejected':
      return 'suspense rejected';
    default:
      return null;
  }
}

function getReactEventColor(event: ReactEvent): string | null {
  switch (event.type) {
    case 'schedule-render':
      return COLORS.REACT_SCHEDULE_HOVER;
    case 'schedule-state-update':
    case 'schedule-force-update':
      return event.isCascading
        ? COLORS.REACT_SCHEDULE_CASCADING_HOVER
        : COLORS.REACT_SCHEDULE_HOVER;
    case 'suspense-suspend':
    case 'suspense-resolved':
    case 'suspense-rejected':
      return COLORS.REACT_SUSPEND_HOVER;
    default:
      return null;
  }
}

function getReactMeasureLabel(type): string | null {
  switch (type) {
    case 'commit':
      return 'commit';
    case 'render-idle':
      return 'idle';
    case 'render':
      return 'render';
    case 'layout-effects':
      return 'layout effects';
    case 'passive-effects':
      return 'passive effects';
    default:
      return null;
  }
}

export default function EventTooltip({data, hoveredEvent, origin}: Props) {
  const tooltipRef = useSmartTooltip({
    mouseX: origin.x,
    mouseY: origin.y,
  });

  if (hoveredEvent === null) {
    return null;
  }

  const {event, measure, flamechartStackFrame, userTimingMark} = hoveredEvent;

  if (event !== null) {
    return <TooltipReactEvent event={event} tooltipRef={tooltipRef} />;
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

function formatComponentStack(componentStack: string): string {
  const lines = componentStack.split('\n').map(line => line.trim());
  lines.shift();

  if (lines.length > 5) {
    return lines.slice(0, 5).join('\n') + '\n...';
  }
  return lines.join('\n');
}

const TooltipFlamechartNode = ({
  stackFrame,
  tooltipRef,
}: {
  stackFrame: FlamechartStackFrame,
  tooltipRef: Return<typeof useRef>,
}) => {
  const {
    name,
    timestamp,
    duration,
    scriptUrl,
    locationLine,
    locationColumn,
  } = stackFrame;
  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      {formatDuration(duration)}
      <span className={styles.FlamechartStackFrameName}>{name}</span>
      <div className={styles.DetailsGrid}>
        <div className={styles.DetailsGridLabel}>Timestamp:</div>
        <div>{formatTimestamp(timestamp)}</div>
        {scriptUrl && (
          <>
            <div className={styles.DetailsGridLabel}>Script URL:</div>
            <div className={styles.DetailsGridURL}>{scriptUrl}</div>
          </>
        )}
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
  );
};

const TooltipReactEvent = ({
  event,
  tooltipRef,
}: {
  event: ReactEvent,
  tooltipRef: Return<typeof useRef>,
}) => {
  const label = getReactEventLabel(event.type);
  const color = getReactEventColor(event);
  if (!label || !color) {
    if (__DEV__) {
      console.warn('Unexpected event type "%s"', event.type);
    }
    return null;
  }

  const {componentName, componentStack, timestamp} = event;

  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      {componentName && (
        <span className={styles.ComponentName} style={{color}}>
          {trimmedString(componentName, 768)}
        </span>
      )}
      {label}
      <div className={styles.Divider} />
      <div className={styles.DetailsGrid}>
        <div className={styles.DetailsGridLabel}>Timestamp:</div>
        <div>{formatTimestamp(timestamp)}</div>
        {componentStack && (
          <Fragment>
            <div className={styles.DetailsGridLabel}>Component stack:</div>
            <pre className={styles.ComponentStack}>
              {formatComponentStack(componentStack)}
            </pre>
          </Fragment>
        )}
      </div>
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

  return (
    <div className={styles.Tooltip} ref={tooltipRef}>
      {formatDuration(duration)}
      <span className={styles.ReactMeasureLabel}>{label}</span>
      <div className={styles.Divider} />
      <div className={styles.DetailsGrid}>
        <div className={styles.DetailsGridLabel}>Timestamp:</div>
        <div>{formatTimestamp(timestamp)}</div>
        <div className={styles.DetailsGridLabel}>Batch duration:</div>
        <div>{formatDuration(stopTime - startTime)}</div>
        <div className={styles.DetailsGridLabel}>
          Lane{lanes.length === 1 ? '' : 's'}:
        </div>
        <div>{lanes.join(', ')}</div>
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
      <span className={styles.UserTimingLabel}>{name}</span>
      <div className={styles.Divider} />
      <div className={styles.DetailsGrid}>
        <div className={styles.DetailsGridLabel}>Timestamp:</div>
        <div>{formatTimestamp(timestamp)}</div>
      </div>
    </div>
  );
};
