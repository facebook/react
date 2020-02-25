/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Suspense, Fragment} from 'react';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import {InspectedElementContextController} from './InspectedElementContext';
import {NativeStyleContextController} from './NativeStyleEditor/context';
import {OwnersListContextController} from './OwnersListContext';
import ComponentsResizer from './ComponentsResizer';
import portaledContent from '../portaledContent';
import {ModalDialog} from '../ModalDialog';
import SettingsModal from 'react-devtools-shared/src/devtools/views/Settings/SettingsModal';
import {SettingsModalContextController} from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContext';

import styles from './Components.css';

function Components(_: {||}) {
  return (
    <SettingsModalContextController>
      <OwnersListContextController>
        <InspectedElementContextController>
          <ComponentsResizer>
            {({resizeElementRef, onResizeStart}) => (
              <Fragment>
                <div ref={resizeElementRef} className={styles.TreeWrapper}>
                  <Tree />
                </div>
                <div className={styles.ResizeBarWrapper}>
                  <div
                    onMouseDown={onResizeStart}
                    className={styles.ResizeBar}
                  />
                </div>
                <div className={styles.SelectedElementWrapper}>
                  <NativeStyleContextController>
                    <Suspense fallback={<Loading />}>
                      <SelectedElement />
                    </Suspense>
                  </NativeStyleContextController>
                </div>
                <ModalDialog />
                <SettingsModal />
              </Fragment>
            )}
          </ComponentsResizer>
        </InspectedElementContextController>
      </OwnersListContextController>
    </SettingsModalContextController>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}

export default portaledContent(Components);
