/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import KeyValue from './KeyValue';
import Store from '../../store';
import sharedStyles from './InspectedElementSharedStyles.css';
import styles from './InspectedElementStyleXPlugin.css';

import type {InspectedElement} from './types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Element} from 'react-devtools-shared/src/devtools/views/Components/types';

type Props = {|
  bridge: FrontendBridge,
  element: Element,
  inspectedElement: InspectedElement,
  store: Store,
|};

export default function InspectedElementStyleXPlugin({
  bridge,
  element,
  inspectedElement,
  store,
}: Props) {
  const styleXPlugin = inspectedElement.plugins.find(
    ({type}) => type === 'stylex',
  );
  if (styleXPlugin == null || styleXPlugin.data == null) {
    return null;
  }

  const {resolvedStyles, sources} = styleXPlugin.data;

  return (
    <div className={sharedStyles.InspectedElementTree}>
      <div className={sharedStyles.HeaderRow}>
        <div className={sharedStyles.Header}>stylex</div>
      </div>
      {sources.map(source => (
        <div key={source} className={styles.Source}>
          {source}
        </div>
      ))}
      {Object.entries(resolvedStyles).map(([name, value]) => (
        <KeyValue
          key={name}
          alphaSort={true}
          bridge={bridge}
          canDeletePaths={false}
          canEditValues={false}
          canRenamePaths={false}
          depth={1}
          element={element}
          hidden={false}
          inspectedElement={inspectedElement}
          name={name}
          path={[name]}
          pathRoot="stylex"
          store={store}
          value={value}
        />
      ))}
    </div>
  );
}
