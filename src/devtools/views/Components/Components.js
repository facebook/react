// @flow

import React, { Suspense } from 'react';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import { InspectedElementContextController } from './InspectedElementContext';
import portaledContent from '../portaledContent';

import styles from './Components.css';

function Components(_: {||}) {
  // TODO Flex wrappers below should be user resizable.
  return (
    <div className={styles.Components}>
      <div className={styles.TreeWrapper}>
        <Tree />
      </div>
      <div className={styles.SelectedElementWrapper}>
        <InspectedElementContextController>
          <Suspense fallback={<Loading />}>
            <SelectedElement />
          </Suspense>
        </InspectedElementContextController>
      </div>
    </div>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}

export default portaledContent(Components);
