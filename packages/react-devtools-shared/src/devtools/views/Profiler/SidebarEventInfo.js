/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SchedulingEvent} from 'react-devtools-timeline/src/types';

import * as React from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import ViewSourceContext from '../Components/ViewSourceContext';
import {useContext} from 'react';
import {TimelineContext} from 'react-devtools-timeline/src/TimelineContext';
import {stackToComponentSources} from 'react-devtools-shared/src/devtools/utils';

import styles from './SidebarEventInfo.css';

export type Props = {||};

function SchedulingEventInfo({eventInfo}: {eventInfo: SchedulingEvent}) {
  const {viewUrlSourceFunction} = useContext(ViewSourceContext);

  const componentStack = eventInfo.componentStack
    ? stackToComponentSources(eventInfo.componentStack)
    : null;

  const viewSource = source => {
    if (viewUrlSourceFunction != null && source != null) {
      viewUrlSourceFunction(...source);
    }
  };

  return (
    <div className={styles.Content} tabIndex={0}>
      {componentStack ? (
        <ol className={styles.List}>
          {componentStack.map(([displayName, source], index) => {
            const hasSource = source != null;

            return (
              <li
                key={index}
                className={styles.ListItem}
                data-source={hasSource}>
                <label className={styles.Label}>
                  <Button
                    className={styles.Button}
                    onClick={() => viewSource(source)}>
                    {displayName}
                  </Button>
                  {hasSource && (
                    <ButtonIcon className={styles.Source} type="view-source" />
                  )}
                </label>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

export default function SidebarEventInfo(_: Props) {
  const {selectedEvent} = useContext(TimelineContext);
  // (TODO) Refactor in next PR so this supports multiple types of events
  return selectedEvent ? (
    <>
      <div className={styles.Toolbar}>Event Component Tree</div>
      {selectedEvent.schedulingEvent ? (
        <SchedulingEventInfo eventInfo={selectedEvent.schedulingEvent} />
      ) : null}
    </>
  ) : null;
}
