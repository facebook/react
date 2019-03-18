// @flow

import React from 'react';
import { createPortal } from 'react-dom';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import styles from './Elements.css';

export type Props = {|
  portalContainer?: Element,
|};

export default function Elements({ portalContainer }: Props) {
  // TODO Flex wrappers below should be user resizable.
  const children = (
    <div className={styles.Elements}>
      <div className={styles.TreeWrapper}>
        <Tree />
      </div>
      <div className={styles.SelectedElementWrapper}>
        <SelectedElement />
      </div>
    </div>
  );

  return portalContainer != null
    ? createPortal(children, portalContainer)
    : children;
}
