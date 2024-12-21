/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {OptionsContext} from '../context';
import EditableValue from './EditableValue';
import Store from '../../store';
import {ElementTypeSuspense} from 'react-devtools-shared/src/frontend/types';
import styles from './InspectedElementSharedStyles.css';

import type {InspectedElement} from 'react-devtools-shared/src/frontend/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

type Props = {
  bridge: FrontendBridge,
  inspectedElement: InspectedElement,
  store: Store,
};

export default function InspectedElementSuspenseToggle({
  bridge,
  inspectedElement,
  store,
}: Props): React.Node {
  const {readOnly} = React.useContext(OptionsContext);

  const {id, state, type} = inspectedElement;
  const canToggleSuspense = !readOnly && inspectedElement.canToggleSuspense;

  if (type !== ElementTypeSuspense) {
    return null;
  }

  const isSuspended = state !== null;

  const toggleSuspense = (path: any, value: boolean) => {
    const rendererID = store.getRendererIDForElement(id);
    if (rendererID !== null) {
      bridge.send('overrideSuspense', {
        id,
        rendererID,
        forceFallback: value,
      });
    }
  };

  return (
    <div>
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>suspense</div>
      </div>
      <div className={styles.ToggleSuspenseRow}>
        <span className={styles.Name}>Suspended</span>
        {canToggleSuspense ? (
          // key is required to keep <EditableValue> and header row toggle button in sync
          <EditableValue
            key={isSuspended}
            overrideValue={toggleSuspense}
            path={['suspense', 'Suspended']}
            value={isSuspended}
          />
        ) : (
          <span className={styles.Value}>{isSuspended ? 'true' : 'false'}</span>
        )}
      </div>
    </div>
  );
}
