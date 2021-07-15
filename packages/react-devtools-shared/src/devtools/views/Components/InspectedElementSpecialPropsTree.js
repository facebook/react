/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Store from '../../store';
import styles from './InspectedElementSharedStyles.css';

// This is a little janky but it keeps the visual styles in sync.
import keyValueStyles from './KeyValue.css';

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
  const {key} = element;
  const {ref} = inspectedElement;

  if (key === null && ref === null) {
    return null;
  }

  const learnMore = () => {};

  return (
    <div className={styles.InspectedElementTree}>
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>special props</div>
        <Button onClick={learnMore} title="Learn more">
          <ButtonIcon type="info" />
        </Button>
      </div>
      {key && (
        <div className={keyValueStyles.Item} style={{paddingLeft: '0.75rem'}}>
          key
          <div className={keyValueStyles.AfterName}>:</div>
          <span className={keyValueStyles.Value}>{`"${key}"`}</span>
        </div>
      )}
      {ref && (
        <div className={keyValueStyles.Item} style={{paddingLeft: '0.75rem'}}>
          ref
          <div className={keyValueStyles.AfterName}>:</div>
          <span className={keyValueStyles.Value}>{ref}</span>
        </div>
      )}
    </div>
  );
}
