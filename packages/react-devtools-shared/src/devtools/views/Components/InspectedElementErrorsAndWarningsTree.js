/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Store from '../../store';
import sharedStyles from './InspectedElementSharedStyles.css';
import styles from './InspectedElementErrorsAndWarningsTree.css';
import {SettingsContext} from '../Settings/SettingsContext';
import {InspectedElementContext} from './InspectedElementContext';

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
  const {refreshInspectedElement} = useContext(InspectedElementContext);

  const {showInlineWarningsAndErrors} = useContext(SettingsContext);
  if (!showInlineWarningsAndErrors) {
    return null;
  }

  const {errors, warnings} = inspectedElement;

  const clearErrors = () => {
    const {id} = inspectedElement;
    store.clearErrorsForElement(id);

    // Immediately poll for updated data.
    // This avoids a delay between clicking the clear button and refreshing errors.
    // Ideally this would be done with useTranstion but that requires updating to a newer Cache strategy.
    refreshInspectedElement();
  };

  const clearWarnings = () => {
    const {id} = inspectedElement;
    store.clearWarningsForElement(id);

    // Immediately poll for updated data.
    // This avoids a delay between clicking the clear button and refreshing warnings.
    // Ideally this would be done with useTranstion but that requires updating to a newer Cache strategy.
    refreshInspectedElement();
  };

  return (
    <React.Fragment>
      {errors.length > 0 && (
        <Tree
          badgeClassName={styles.ErrorBadge}
          bridge={bridge}
          className={styles.ErrorTree}
          clearMessages={clearErrors}
          entries={errors}
          label="errors"
          messageClassName={styles.Error}
        />
      )}
      {warnings.length > 0 && (
        <Tree
          badgeClassName={styles.WarningBadge}
          bridge={bridge}
          className={styles.WarningTree}
          clearMessages={clearWarnings}
          entries={warnings}
          label="warnings"
          messageClassName={styles.Warning}
        />
      )}
    </React.Fragment>
  );
}

type TreeProps = {|
  badgeClassName: string,
  actions: React$Node,
  className: string,
  clearMessages: () => {},
  entries: Array<[string, number]>,
  label: string,
  messageClassName: string,
|};

function Tree({
  badgeClassName,
  actions,
  className,
  clearMessages,
  entries,
  label,
  messageClassName,
}: TreeProps) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <div className={`${sharedStyles.InspectedElementTree} ${className}`}>
      <div className={`${sharedStyles.HeaderRow} ${styles.HeaderRow}`}>
        <div className={sharedStyles.Header}>{label}</div>
        <Button
          onClick={clearMessages}
          title={`Clear all ${label} for this component`}>
          <ButtonIcon type="clear" />
        </Button>
      </div>
      {entries.map(([message, count], index) => (
        <ErrorOrWarningView
          key={`${label}-${index}`}
          badgeClassName={badgeClassName}
          className={messageClassName}
          count={count}
          message={message}
        />
      ))}
    </div>
  );
}

type ErrorOrWarningViewProps = {|
  badgeClassName: string,
  className: string,
  count: number,
  message: string,
|};

function ErrorOrWarningView({
  className,
  badgeClassName,
  count,
  message,
}: ErrorOrWarningViewProps) {
  return (
    <div className={className}>
      {count > 1 && <div className={badgeClassName}>{count}</div>}
      <div className={styles.Message} title={message}>
        {message}
      </div>
    </div>
  );
}
