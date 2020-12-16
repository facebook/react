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
import sharedStyles from './InspectedElementSharedStyles.css';
import styles from './InspectedElementErrorsAndWarningsTree.css';

import type {InspectedElement} from './types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

type Props = {|
  bridge: FrontendBridge,
  inspectedElement: InspectedElement,
  store: Store,
|};

export default function InspectedElementErrorsAndWarningsTree({
  bridge,
  inspectedElement,
  store,
}: Props) {
  const {errors, warnings} = inspectedElement;

  return (
    <React.Fragment>
      <Tree
        actions={
          <Button
            onClick={() => store.clearErrorsForElement(inspectedElement.id)}
            title="Clear errors">
            <ButtonIcon type="clear" />
          </Button>
        }
        className={styles.Error}
        label="errors"
        messages={errors}
      />
      <Tree
        actions={
          <Button
            onClick={() => store.clearWarningsForElement(inspectedElement.id)}
            title="Clear warnings">
            <ButtonIcon type="clear" />
          </Button>
        }
        className={styles.Warning}
        label="warnings"
        messages={warnings}
      />
    </React.Fragment>
  );
}

type TreeProps = {|
  actions: React$Node,
  className: string,
  label: string,
  messages: string[],
|};

function Tree({actions, className, label, messages}: TreeProps) {
  if (messages.length === 0) {
    return null;
  }
  return (
    <div className={styles.InspectedElementErrorOrWarningsTree}>
      <div className={`${sharedStyles.HeaderRow} ${styles.HeaderRow}`}>
        <div className={sharedStyles.Header}>{label}</div>
        {actions}
      </div>
      {messages.map((message, index) => {
        // TODO (inline errors) When we agressively de-duplicate by message we should use the message as key.
        return (
          <div key={index} className={`${styles.ErrorOrWarning} ${className}`}>
            {message}
          </div>
        );
      })}
    </div>
  );
}
