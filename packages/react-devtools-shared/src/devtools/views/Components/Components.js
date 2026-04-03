/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment} from 'react';
import Tree from './Tree';
import {OwnersListContextController} from './OwnersListContext';
import portaledContent from '../portaledContent';
import {SettingsModalContextController} from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContext';
import InspectedElementErrorBoundary from './InspectedElementErrorBoundary';
import InspectedElement from './InspectedElement';
import {ModalDialog} from '../ModalDialog';
import SettingsModal from 'react-devtools-shared/src/devtools/views/Settings/SettingsModal';
import {NativeStyleContextController} from './NativeStyleEditor/context';
import useResizableColumns from '../useResizableColumns';

import styles from './Components.css';

const LOCAL_STORAGE_KEY = 'React::DevTools::createResizeReducer';

function Components(_: {}) {
  const {wrapperRef, resizeElementRef, onResizeStart, onResizeEnd, onResize} =
    useResizableColumns(LOCAL_STORAGE_KEY);

  return (
    <SettingsModalContextController>
      <OwnersListContextController>
        <div ref={wrapperRef} className={styles.Components}>
          <Fragment>
            <div ref={resizeElementRef} className={styles.TreeWrapper}>
              <Tree />
            </div>
            <div className={styles.ResizeBarWrapper}>
              <div
                onPointerDown={onResizeStart}
                onPointerMove={onResize}
                onPointerUp={onResizeEnd}
                className={styles.ResizeBar}
              />
            </div>
            <div className={styles.InspectedElementWrapper}>
              <NativeStyleContextController>
                <InspectedElementErrorBoundary>
                  <InspectedElement
                    fallbackEmpty={
                      'No React element selected. Select an element in the tree to inspect.'
                    }
                  />
                </InspectedElementErrorBoundary>
              </NativeStyleContextController>
            </div>
            <ModalDialog />
            <SettingsModal />
          </Fragment>
        </div>
      </OwnersListContextController>
    </SettingsModalContextController>
  );
}

export default (portaledContent(Components): component());
