/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import sharedStyles from './InspectedElementSharedStyles.css';

// This is a little janky but it keeps the visual styles in sync.
import keyValueStyles from './KeyValue.css';

import type {InspectedElement} from './types';

type Props = {|
  inspectedElement: InspectedElement,
|};

export default function InspectedElementSpecialPropsTree({
  inspectedElement,
}: Props) {
  const {ref} = inspectedElement;

  if (ref === null) {
    return null;
  }

  return (
    <div className={sharedStyles.InspectedElementTree}>
      {ref && (
        <div className={keyValueStyles.Item} style={{paddingLeft: '1rem'}}>
          ref
          <div className={keyValueStyles.AfterName}>:</div>
          <span className={keyValueStyles.Value}>{ref}</span>
        </div>
      )}
    </div>
  );
}
