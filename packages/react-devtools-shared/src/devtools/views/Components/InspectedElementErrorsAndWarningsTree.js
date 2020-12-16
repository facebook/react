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
import {SettingsContext} from '../Settings/SettingsContext';

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
  const {showInlineWarningsAndErrors} = React.useContext(SettingsContext);
  if (!showInlineWarningsAndErrors) {
    return null;
  }

  const {errors, warnings} = inspectedElement;

  // TODO Would be nice if there were some way to either:
  // (1) Temporarily disable the button after click (unstable_useTransition?) or
  // (2) Immediately reflect the cleared list of warnings/errors.
  // The current clear button feels a little unresponsive because we wait to poll for new values.

  const clearErrors = () => {
    store.clearErrorsForElement(inspectedElement.id);
  };

  const clearWarnings = () => {
    store.clearWarningsForElement(inspectedElement.id);
  };

  return (
    <React.Fragment>
      {errors.length > 0 && (
        <Tree
          bridge={bridge}
          className={styles.ErrorTree}
          clearMessages={clearErrors}
          inspectedElement={inspectedElement}
          label="errors"
          messages={errors}
          messageClassName={styles.Error}
          store={store}
        />
      )}
      {warnings.length > 0 && (
        <Tree
          bridge={bridge}
          className={styles.WarningTree}
          clearMessages={clearWarnings}
          inspectedElement={inspectedElement}
          label="warnings"
          messages={warnings}
          messageClassName={styles.Warning}
          store={store}
        />
      )}
    </React.Fragment>
  );
}

type TreeProps = {|
  actions: React$Node,
  className: string,
  clearMessages: () => {},
  label: string,
  messageClassName: string,
  messages: string[],
|};

function Tree({
  actions,
  className,
  clearMessages,
  label,
  messageClassName,
  messages,
}: TreeProps) {
  if (messages.length === 0) {
    return null;
  }
  return (
    <div className={`${sharedStyles.InspectedElementTree} ${className}`}>
      <div className={`${sharedStyles.HeaderRow} ${styles.HeaderRow}`}>
        <div className={sharedStyles.Header}>{label}</div>
        <Button onClick={clearMessages} title="Clear errors and warnings">
          <ButtonIcon type="clear" />
        </Button>
      </div>
      {messages.map((message, index) => (
        <ErrorOrWarningView
          key={`${label}-${index}`}
          className={messageClassName}
          message={message}
        />
      ))}
    </div>
  );
}

type ErrorOrWarningViewProps = {|
  className: string,
  message: string,
|};

function ErrorOrWarningView({message, className}: ErrorOrWarningViewProps) {
  // TODO Render .ErrorBadge or .WarningBadge if count > 1.
  return (
    <div className={className}>
      <div className={styles.Message}>{message}</div>
    </div>
  );
}
