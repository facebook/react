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
import ViewElementSourceContext from '../Components/ViewElementSourceContext';
import {StoreContext} from '../context';
import {useContext, useMemo} from 'react';
import {ProfilerContext} from './ProfilerContext';

import styles from './SidebarEventInfo.css';

export type Props = {||};

export default function SidebarEventInfo(_: Props) {
  const {profilingData, selectedCommitIndex} = useContext(ProfilerContext);
  const {viewElementSourceFunction} = useContext(ViewElementSourceContext);
  const store = useContext(StoreContext);

  const {parents, componentDisplayNames} = useMemo(() => {
    if (
      selectedCommitIndex == null ||
      profilingData == null ||
      profilingData.timelineData.length === 0
    ) {
      return {};
    }
    const {
      schedulingEvents,
      // eslint-disable-next-line no-shadow
      componentDisplayNames,
    } = profilingData.timelineData[0];

    const event = schedulingEvents[selectedCommitIndex];
    if (!isStateUpdateEvent(event)) {
      return {};
    }

    // eslint-disable-next-line no-shadow
    let parents = null;
    if (event.parents) {
      parents = event.parents.filter(id => componentDisplayNames.has(id));
    }

    return {
      parents,
      componentDisplayNames,
    };
  }, [profilingData, selectedCommitIndex]);

  const canInspect = (id: number) =>
    !!(viewElementSourceFunction && store.getElementByID(id));

  let components;
  if (parents) {
    components = parents.map((id, index) => {
      let displayName;
      if (componentDisplayNames) {
        displayName = componentDisplayNames.get(id);
      }

      const hasSource = canInspect(id);

      const onClick = () => {
        const element = store.getElementByID(id);
        if (hasSource && viewElementSourceFunction && element) {
          viewElementSourceFunction(id, (element: any));
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
