// @flow

import React from 'react';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import styles from './Elements.css';

export type Props = {||};

export default function Elements(_: Props) {
  // TODO Flex wrappers below should be user resizable.
  return (
    <div className={styles.Elements}>
      <div className={styles.TreeWrapper}>
        <Tree />
      </div>
      <div className={styles.SelectedElementWrapper}>
        <SelectedElement />
      </div>
    </div>
  );
}
