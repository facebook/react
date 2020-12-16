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
        className={styles.ErrorTree}
        label="errors"
        messageClassName={styles.Error}
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
        className={styles.WarningTree}
        label="warnings"
        messageClassName={styles.Warning}
        messages={warnings}
      />
    </React.Fragment>
  );
}

type TreeProps = {|
  actions: React$Node,
  className: string,
  label: string,
  messageClassName: string,
  messages: string[],
|};

function Tree({
  actions,
  className,
  label,
  messageClassName,
  messages,
}: TreeProps) {
  if (messages.length === 0) {
    return null;
  }
  return (
    <div
      className={`${sharedStyles.InspectedElementTree} ${styles.ErrorOrWarningTree}`}>
      <div className={`${sharedStyles.HeaderRow} ${styles.HeaderRow}`}>
        <div className={sharedStyles.Header}>{label}</div>
        {actions}
      </div>
      {messages.map((message, index) => {
        // TODO (inline errors) When we agressively de-duplicate by message we should use the message as key.
        return (
          <div className={messageClassName} key={index}>
            <div className={styles.Message}>{message}</div>
          </div>
        );
      })}
    </div>
  );
}
