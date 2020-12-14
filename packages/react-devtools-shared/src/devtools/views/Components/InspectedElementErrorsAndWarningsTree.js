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
import Icon from '../Icon';
import {serializeDataForCopy} from '../utils';
import useContextMenu from '../../ContextMenu/useContextMenu';
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
        <div className={sharedStyles.Header}>
          <Icon className={styles.ErrorIcon} type="error" /> errors &amp;{' '}
          <Icon className={styles.WarningIcon} type="warning" /> warnings
        </div>
        <Button
          onClick={() =>
            store.clearErrorsAndWarningsForElement(inspectedElement)
          }
          title="Clear errors and warnings">
          <ButtonIcon type="clear" />
        </Button>
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
  return (
    <React.Fragment>
      {errors.map((error, index) => {
        return (
          <ErrorOrWarningView
            key={`error-${index}`}
            className={styles.Error}
            errorOrWarning={error}
            icon={<Icon className={styles.ErrorIcon} type="error" />}
          />
        );
      })}
      {warnings.map((warning, index) => {
        return (
          <ErrorOrWarningView
            key={`warning-${index}`}
            className={styles.Warning}
            errorOrWarning={warning}
            icon={<Icon className={styles.WarningIcon} type="warning" />}
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
  const {id, args: serializedArgs, type} = errorOrWarning;
  const args = serializedArgs.map(arg => {
    if (arg === null) {
      return null;
    }
    try {
      return JSON.parse(arg);
    } catch (error) {
      console.error(
        `Unable to deserialize type '${type}' of id '${id}': '${arg}'`,
      );
      return null;
    }
  });

  const contextMenuTriggerRef = React.useRef(null);
  useContextMenu({
    data: {
      errorOrWarning,
    },
    id: 'ErrorOrWarning',
    ref: contextMenuTriggerRef,
  });

  return (
    <div
      className={`${styles.ErrorOrWarning} ${className}`}
      ref={contextMenuTriggerRef}>
      {icon}
      <div className={styles.ErrorOrWarningMessage}>{args.join('\n')}</div>
    </div>
  );
}
