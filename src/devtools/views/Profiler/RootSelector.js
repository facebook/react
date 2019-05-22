// @flow

import React, { Fragment, useCallback, useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';

import styles from './RootSelector.css';

export default function RootSelector(_: {||}) {
  const { profilingData, rootID, setRootID } = useContext(ProfilerContext);

  const options = [];
  if (profilingData !== null) {
    profilingData.dataForRoots.forEach((dataForRoot, rootID) => {
      options.push(
        <option key={rootID} value={rootID}>
          {dataForRoot.displayName}
        </option>
      );
    });
  }

  const handleChange = useCallback(
    ({ currentTarget }) => {
      setRootID(parseInt(currentTarget.value, 10));
    },
    [setRootID]
  );

  if (profilingData === null || profilingData.dataForRoots.size <= 1) {
    // Don't take up visual space if there's only one root.
    return null;
  }

  return (
    <Fragment>
      <div className={styles.Spacer} />
      <select value={rootID} onChange={handleChange}>
        {options}
      </select>
    </Fragment>
  );
}
