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
  const [expanded, toggleExpanded] = React.useReducer(
    currentlyExpanded => !currentlyExpanded,
    false,
  );

  return (
    <div className={className}>
      {count > 1 && <div className={badgeClassName}>{count}</div>}
      <div
        className={styles.Message}
        data-expanded={expanded}
        onClick={toggleExpanded}>
        {message}
      </div>
    </div>
  );
}
