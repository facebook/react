// @flow

import React, { Fragment, useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { StoreContext } from '../context';

import styles from './SidebarInteractions.css';

export type Props = {||};

export default function SidebarInteractions(_: Props) {
  const { selectedCommitIndex, rendererID, rootID } = useContext(
    ProfilerContext
  );

  const { profilingCache } = useContext(StoreContext);

  return (
    <Fragment>
      <div className={styles.Toolbar}>Interaction</div>
      <div className={styles.Content}>Coming soon</div>
    </Fragment>
  );
}
