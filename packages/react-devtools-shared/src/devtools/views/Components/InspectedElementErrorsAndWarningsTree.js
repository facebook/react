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
import {useSubscription} from '../hooks';
import sharedStyles from './InspectedElementSharedStyles.css';
import styles from './InspectedElementErrorsAndWarningsTree.css';

import type {InspectedElement} from './types';
import type {ErrorOrWarning} from '../../../types';
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
  // TODO This is not how we will want to subscribe to errors/warnings
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

  return (
    <React.Fragment>
      {errors.length > 0 && (
        <Tree
          bridge={bridge}
          className={styles.ErrorTree}
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
  bridge: FrontendBridge,
  className: string,
  inspectedElement: InspectedElement,
  label: string,
  messages: Array<ErrorOrWarning>,
  messageClassName: string,
  store: Store,
|};

function Tree({
  bridge,
  className,
  inspectedElement,
  label,
  messages,
  messageClassName,
  store,
}: TreeProps) {
  return (
    <div className={`${sharedStyles.InspectedElementTree} ${className}`}>
      <div className={sharedStyles.HeaderRow}>
        <div className={sharedStyles.Header}>{label}</div>
        <Button
          onClick={() =>
            store.clearErrorsAndWarningsForElement(inspectedElement)
          }
          title="Clear errors and warnings">
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
  message: ErrorOrWarning,
|};

function ErrorOrWarningView({message, className}: ErrorOrWarningViewProps) {
  const {id, args: serializedArgs, type} = message;

  // TODO Messages could be strinigified before being sent to the frontend.
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

  // TODO
  const text = args.join('\n');

  return (
    <div className={className}>
      <div className={styles.Message}>{text}</div>
    </div>
  );
}
