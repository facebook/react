/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
import {serializeDataForCopy} from '../utils';
import Store from '../../store';
import styles from './InspectedElementSharedStyles.css';

import type {InspectedElement} from './types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Element} from 'react-devtools-shared/src/devtools/views/Components/types';

type Props = {|
  bridge: FrontendBridge,
  element: Element,
  inspectedElement: InspectedElement,
  store: Store,
|};

export default function InspectedElementPropsTree({
  bridge,
  element,
  inspectedElement,
  store,
}: Props) {
  const {ref} = inspectedElement;

  if (ref === null) {
    return null;
  }

  const handleCopy = () => copy(serializeDataForCopy({ref}));

  return (
    <div className={styles.InspectedElementTree}>
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>Ref</div>
        <Button onClick={handleCopy} title="Copy to clipboard">
          <ButtonIcon type="copy" />
        </Button>
      </div>
      <KeyValue
        key="value"
        alphaSort={true}
        bridge={bridge}
        canDeletePaths={false}
        canEditValues={false}
        canRenamePaths={false}
        depth={1}
        element={element}
        hidden={false}
        inspectedElement={inspectedElement}
        name={'ref'}
        path={['value']}
        pathRoot="ref"
        store={store}
        value={ref}
      />
    </div>
  );
}
