// @flow

import React, { Suspense } from 'react';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import styles from './Components.css';
import portaledContent from '../portaledContent';

function Components(_: {||}) {
  // TODO Flex wrappers below should be user resizable.
  return (
    <div className={styles.Components}>
      <div className={styles.TreeWrapper}>
        <Tree />
      </div>
      <div className={styles.SelectedElementWrapper}>
        <Suspense fallback={<Loading />}>
          <SelectedElement />
        </Suspense>
      </div>
    </div>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}

export default portaledContent(Components);
