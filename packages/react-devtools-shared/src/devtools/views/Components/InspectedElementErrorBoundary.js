/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Component, useContext} from 'react';
import {TreeDispatcherContext} from './TreeContext';
import Button from 'react-devtools-shared/src/devtools/views/Button';
import styles from './InspectedElementErrorBoundary.css';

import type {DispatcherContext} from './InspectedElementErrorBoundary.css';

type WrapperProps = {|
  children: React$Node,
|};

export default function InspectedElementErrorBoundaryWrapper({
  children,
}: WrapperProps) {
  const dispatch = useContext(TreeDispatcherContext);

  return (
    <InspectedElementErrorBoundary children={children} dispatch={dispatch} />
  );
}

type Props = {|
  children: React$Node,
  dispatch: DispatcherContext,
|};

type State = {|
  errorMessage: string | null,
  hasError: boolean,
|};

const InitialState: State = {
  errorMessage: null,
  hasError: false,
};

class InspectedElementErrorBoundary extends Component<Props, State> {
  state: State = InitialState;

  static getDerivedStateFromError(error: any) {
    const errorMessage =
      typeof error === 'object' &&
      error !== null &&
      error.hasOwnProperty('message')
        ? error.message
        : error;

    return {
      errorMessage,
      hasError: true,
    };
  }

  render() {
    const {children} = this.props;
    const {errorMessage, hasError} = this.state;

    if (hasError) {
      return (
        <div className={styles.Error}>
          <div className={styles.Message}>{errorMessage || 'Error'}</div>
          <Button className={styles.RetryButton} onClick={this._retry}>
            Dismiss
          </Button>
        </div>
      );
    }

    return children;
  }

  _retry = () => {
    const {dispatch} = this.props;
    dispatch({
      type: 'SELECT_ELEMENT_BY_ID',
      payload: null,
    });
    this.setState({
      errorMessage: null,
      hasError: false,
    });
  };
}
