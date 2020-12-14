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
import {serializeDataForCopy} from '../utils';
import Store from '../../store';
import {useSubscription} from '../hooks';
import sharedStyles from './InspectedElementSharedStyles.css';
import styles from './InspectedElementErrorsAndWarningsTree.css';

import type {InspectedElement} from './types';
import type {ErrorOrWarning} from '../../../types';
import type {GetInspectedElementPath} from './InspectedElementContext';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

type Props = {|
  bridge: FrontendBridge,
  getInspectedElementPath: GetInspectedElementPath,
  inspectedElement: InspectedElement,
  store: Store,
|};

export default function InspectedElementErrorsAndWarningsTree({
  bridge,
  getInspectedElementPath,
  inspectedElement,
  store,
}: Props) {
  const errorsAndWarningsSubscription = React.useMemo(
    () => ({
      getCurrentValue: () => store.errorsAndWarnings.get(inspectedElement.id),
      subscribe: (callback: Function) => {
        store.addListener('errorsAndWarnings', callback);
        return () => store.removeListener('errorsAndWarnings', callback);
      },
    }),
    [store, inspectedElement],
  );
  const {errors = [], warnings = []} =
    useSubscription<{
      errors: ErrorOrWarning[],
      warnings: ErrorOrWarning[],
    } | void>(errorsAndWarningsSubscription) || {};

  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  const handleCopy = () => copy(serializeDataForCopy({errors, warnings}));

  return (
    <div className={sharedStyles.InspectedElementTree}>
      <div className={sharedStyles.HeaderRow}>
        {/* TODO (inline errors) icons instead? Prefix with icons so that the icon is associated with the label */}
        <div className={sharedStyles.Header}>errors/warnings</div>
        <Button onClick={handleCopy} title="Copy to clipboard">
          <ButtonIcon type="copy" />
        </Button>
      </div>
      <InnerErrorsAndWarningsTreeView errors={errors} warnings={warnings} />
    </div>
  );
}

type InnerErrorsAndWarningsTreeViewProps = {|
  errors: ErrorOrWarning[],
  warnings: ErrorOrWarning[],
|};

function InnerErrorsAndWarningsTreeView({
  errors,
  warnings,
}: InnerErrorsAndWarningsTreeViewProps) {
  // TODO (inline errors) keys for each message
  return (
    <React.Fragment>
      {errors.map(error => {
        return (
          <ErrorOrWarningView
            className={styles.Error}
            errorOrWarning={error}
            icon="❌"
          />
        );
      })}
      {warnings.map(warning => {
        return (
          <ErrorOrWarningView
            className={styles.Warning}
            errorOrWarning={warning}
            icon="⚠️"
          />
        );
      })}
    </React.Fragment>
  );
}

type ErrorOrWarningViewProps = {|
  className: string,
  errorOrWarning: ErrorOrWarning,
  icon: React.Node,
|};

function ErrorOrWarningView({
  className,
  errorOrWarning,
  icon,
}: ErrorOrWarningViewProps) {
  return (
    <div className={`${styles.ErrorOrWarning} ${className}`}>
      {icon}:{' '}
      <span className={styles.ErrorOrWarningMessage}>
        {JSON.stringify(errorOrWarning)}
      </span>
    </div>
  );
}
