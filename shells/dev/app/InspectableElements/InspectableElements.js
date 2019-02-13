// @flow

import React from 'react';
import Contexts from './Contexts';
import CustomHooks from './CustomHooks';
import NestedProps from './NestedProps';
import styles from './InspectableElements.css';

// TODO Add Immutable JS example

export default function InspectableElements() {
  return (
    <div className={styles.App}>
      <div className={styles.Header}>Inspectable elements</div>
      <NestedProps />
      <Contexts />
      <CustomHooks />
    </div>
  );
}
