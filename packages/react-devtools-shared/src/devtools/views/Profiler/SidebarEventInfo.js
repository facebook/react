/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Stack} from '../../utils';
import type {SchedulingEvent} from 'react-devtools-timeline/src/types';

import * as React from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import ViewSourceContext from '../Components/ViewSourceContext';
import {useContext} from 'react';
import {TimelineContext} from 'react-devtools-timeline/src/TimelineContext';
import {
  formatTimestamp,
  getSchedulingEventLabel,
} from 'react-devtools-timeline/src/utils/formatting';
import {stackToComponentSources} from 'react-devtools-shared/src/devtools/utils';
import {copy} from 'clipboard-js';

import styles from './SidebarEventInfo.css';

export type Props = {};

type SchedulingEventProps = {
  eventInfo: SchedulingEvent,
};

function SchedulingEventInfo({eventInfo}: SchedulingEventProps) {
  const {viewUrlSourceFunction} = useContext(ViewSourceContext);
  const {componentName, timestamp} = eventInfo;
  const componentStack = eventInfo.componentStack || null;

  const viewSource = (source: ?Stack) => {
    if (viewUrlSourceFunction != null && source != null) {
      viewUrlSourceFunction(...source);
    }
  };

  return (
    <>
      <div className={styles.Toolbar}>
        {componentName} {getSchedulingEventLabel(eventInfo)}
      </div>
      <div className={styles.Content} tabIndex={0}>
        <ul className={styles.List}>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Timestamp</label>:{' '}
            <span className={styles.Value}>{formatTimestamp(timestamp)}</span>
          </li>
          {componentStack && (
            <li className={styles.ListItem}>
              <div className={styles.Row}>
                <label className={styles.Label}>Rendered by</label>
                <Button
                  onClick={() => copy(componentStack)}
                  title="Copy component stack to clipboard">
                  <ButtonIcon type="copy" />
                </Button>
              </div>
              <ul className={styles.List}>
                {stackToComponentSources(componentStack).map(
                  ([displayName, source], index) => {
                    return (
                      <li key={index}>
                        <Button
                          className={
                            source
                              ? styles.ClickableSource
                              : styles.UnclickableSource
                          }
                          disabled={!source}
                          onClick={() => viewSource(source)}>
                          {displayName}
                        </Button>
                      </li>
                    );
                  },
                )}
              </ul>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

export default function SidebarEventInfo(_: Props): React.Node {
  const {selectedEvent} = useContext(TimelineContext);
  // (TODO) Refactor in next PR so this supports multiple types of events
  if (selectedEvent && selectedEvent.schedulingEvent) {
    return <SchedulingEventInfo eventInfo={selectedEvent.schedulingEvent} />;
  }

  return null;
}
