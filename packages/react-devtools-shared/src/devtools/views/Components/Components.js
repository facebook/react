/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Suspense} from 'react';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import {InspectedElementContextController} from './InspectedElementContext';
import {NativeStyleContextController} from './NativeStyleEditor/context';
import {OwnersListContextController} from './OwnersListContext';
import portaledContent from '../portaledContent';
import {ModalDialog} from '../ModalDialog';
import SettingsModal from 'react-devtools-shared/src/devtools/views/Settings/SettingsModal';
import {SettingsModalContextController} from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContext';

import styles from './Components.css';

function Components(_: {||}) {
  // TODO Flex wrappers below should be user resizable.
  return (
    <SettingsModalContextController>
      <OwnersListContextController>
        <InspectedElementContextController>
          <div className={styles.Components}>
            <div className={styles.TreeWrapper}>
              <Tree />
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
          </div>
        </InspectedElementContextController>
      </OwnersListContextController>
    </SettingsModalContextController>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}

export default portaledContent(Components);
