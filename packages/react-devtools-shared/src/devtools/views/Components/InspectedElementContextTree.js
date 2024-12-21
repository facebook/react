/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import * as React from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import KeyValue from './KeyValue';
import {alphaSortEntries, serializeDataForCopy} from '../utils';
import Store from '../../store';
import styles from './InspectedElementSharedStyles.css';
import {
  ElementTypeClass,
  ElementTypeFunction,
} from 'react-devtools-shared/src/frontend/types';

import type {InspectedElement} from 'react-devtools-shared/src/frontend/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Element} from 'react-devtools-shared/src/frontend/types';

type Props = {
  bridge: FrontendBridge,
  element: Element,
  inspectedElement: InspectedElement,
  store: Store,
};

export default function InspectedElementContextTree({
  bridge,
  element,
  inspectedElement,
  store,
}: Props): React.Node {
  const {hasLegacyContext, context, type} = inspectedElement;

  const isReadOnly = type !== ElementTypeClass && type !== ElementTypeFunction;

  const entries = context != null ? Object.entries(context) : null;
  if (entries !== null) {
    entries.sort(alphaSortEntries);
  }

  const isEmpty = entries === null || entries.length === 0;

  const handleCopy = () => copy(serializeDataForCopy(((context: any): Object)));

  // We add an object with a "value" key as a wrapper around Context data
  // so that we can use the shared <KeyValue> component to display it.
  // This wrapper object can't be renamed.
  // $FlowFixMe[missing-local-annot]
  const canRenamePathsAtDepth = depth => depth > 1;

  if (isEmpty) {
    return null;
  } else {
    return (
      <div>
        <div className={styles.HeaderRow}>
          <div className={styles.Header}>
            {hasLegacyContext ? 'legacy context' : 'context'}
          </div>
          {!isEmpty && (
            <Button onClick={handleCopy} title="Copy to clipboard">
              <ButtonIcon type="copy" />
            </Button>
          )}
        </div>
        {isEmpty && <div className={styles.Empty}>None</div>}
        {!isEmpty &&
          (entries: any).map(([name, value]) => (
            <KeyValue
              key={name}
              alphaSort={true}
              bridge={bridge}
              canDeletePaths={!isReadOnly}
              canEditValues={!isReadOnly}
              canRenamePaths={!isReadOnly}
              canRenamePathsAtDepth={canRenamePathsAtDepth}
              depth={1}
              element={element}
              hidden={false}
              inspectedElement={inspectedElement}
              name={name}
              path={[name]}
              pathRoot="context"
              store={store}
              type="context"
              value={value}
            />
          ))}
      </div>
    );
  }
}
