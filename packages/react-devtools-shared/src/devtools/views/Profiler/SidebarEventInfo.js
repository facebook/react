/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {isStateUpdateEvent} from 'react-devtools-timeline/src/utils/flow';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import ViewSourceContext from '../Components/ViewSourceContext';
import {useContext, useMemo} from 'react';
import {ProfilerContext} from './ProfilerContext';
import {stackToComponentSources} from 'react-devtools-shared/src/devtools/utils';

import styles from './SidebarEventInfo.css';

export type Props = {||};

export default function SidebarEventInfo(_: Props) {
  const {profilingData, selectedCommitIndex} = useContext(ProfilerContext);
  const {viewUrlSourceFunction} = useContext(ViewSourceContext);

  const {stack} = useMemo(() => {
    if (
      selectedCommitIndex == null ||
      profilingData == null ||
      profilingData.timelineData.length === 0
    ) {
      return {};
    }
    const {schedulingEvents} = profilingData.timelineData[0];

    const event = schedulingEvents[selectedCommitIndex];
    if (!isStateUpdateEvent(event)) {
      return {};
    }

    let componentStack = null;
    if (event.componentStack) {
      componentStack = stackToComponentSources(event.componentStack);
    }

    return {
      stack: componentStack,
    };
  }, [profilingData, selectedCommitIndex]);

  let components;
  if (stack) {
    components = stack.map(([displayName, source], index) => {
      const hasSource = source != null;

      const onClick = () => {
        if (viewUrlSourceFunction != null && source != null) {
          viewUrlSourceFunction(...source);
        }
      };

      return (
        <li key={index} className={styles.ListItem} data-source={hasSource}>
          <label className={styles.Label}>
            <Button className={styles.Button} onClick={onClick}>
              {displayName}
            </Button>
            {hasSource && (
              <ButtonIcon className={styles.Source} type="view-source" />
            )}
          </label>
        </li>
      );
    });
  }

  return (
    <>
      <div className={styles.Toolbar}>Event Component Tree</div>
      <div className={styles.Content} tabIndex={0}>
        <ol className={styles.List}>{components}</ol>
      </div>
    </>
  );
}
