/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Suspense, useContext} from 'react';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import {InspectedElementContextController} from './InspectedElementContext';
import {NativeStyleContextController} from './NativeStyleEditor/context';
import {OwnersListContextController} from './OwnersListContext';
import portaledContent from '../portaledContent';
import {ModalDialog} from '../ModalDialog';
import SettingsModal from 'react-devtools-shared/src/devtools/views/Settings/SettingsModal';
import {SettingsModalContextController} from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContext';
import {StoreContext} from '../context';

import styles from './Components.css';

function Components(_: {||}) {
  const {supportsReact} = useContext(StoreContext);

  // TODO Flex wrappers below should be user resizable.
  return (
    <SettingsModalContextController>
      <OwnersListContextController>
        <InspectedElementContextController>
          {supportsReact ? (
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
          ) : (
            <UnsupportedReactVersion />
          )}
        </InspectedElementContextController>
      </OwnersListContextController>
    </SettingsModalContextController>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}

function UnsupportedReactVersion() {
  return (
    <div className={styles.Column}>
      <div className={styles.Header}>Unsupported React version.</div>
      <p className={styles.Paragraph}>
        React DevTools support requires a development build of React v15.0+.
      </p>
    </div>
  );
}

export default portaledContent(Components);
