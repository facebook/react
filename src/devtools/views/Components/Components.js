// @flow

import React, { Suspense } from 'react';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import { InspectedElementContextController } from './InspectedElementContext';
import { OwnersListContextController } from './OwnersListContext';
import portaledContent from '../portaledContent';
import { ModalDialog } from '../ModalDialog';

import styles from './Components.css';

function Components(_: {||}) {
  // TODO Flex wrappers below should be user resizable.
  return (
    <OwnersListContextController>
      <InspectedElementContextController>
        <div className={styles.Components}>
          <div className={styles.TreeWrapper}>
            <Tree />
          </div>
          <div className={styles.SelectedElementWrapper}>
            <Suspense fallback={<Loading />}>
              <SelectedElement />
            </Suspense>
          </div>
          <ModalDialog />
        </div>
      </InspectedElementContextController>
    </OwnersListContextController>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}

export default portaledContent(Components);
