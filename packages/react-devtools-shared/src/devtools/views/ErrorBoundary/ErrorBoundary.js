/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Component, Suspense} from 'react';
import Store from 'react-devtools-shared/src/devtools/store';
import UnsupportedBridgeOperationView from './UnsupportedBridgeOperationView';
import ErrorView from './ErrorView';
import SearchingGitHubIssues from './SearchingGitHubIssues';
import SuspendingErrorView from './SuspendingErrorView';
import TimeoutView from './TimeoutView';
import UnsupportedBridgeOperationError from 'react-devtools-shared/src/UnsupportedBridgeOperationError';
import TimeoutError from 'react-devtools-shared/src/TimeoutError';
import {logEvent} from 'react-devtools-shared/src/Logger';

type Props = {|
  children: React$Node,
  canDismiss?: boolean,
  onBeforeDismissCallback?: () => void,
  store?: Store,
|};

type State = {|
  callStack: string | null,
  canDismiss: boolean,
  componentStack: string | null,
  errorMessage: string | null,
  hasError: boolean,
  isUnsupportedBridgeOperationError: boolean,
  isTimeout: boolean,
|};

const InitialState: State = {
  callStack: null,
  canDismiss: false,
  componentStack: null,
  errorMessage: null,
  hasError: false,
  isUnsupportedBridgeOperationError: false,
  isTimeout: false,
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = InitialState;

  static getDerivedStateFromError(error: any) {
    const errorMessage =
      typeof error === 'object' &&
      error !== null &&
      typeof error.message === 'string'
        ? error.message
        : null;

    const isTimeout = error instanceof TimeoutError;
    const isUnsupportedBridgeOperationError =
      error instanceof UnsupportedBridgeOperationError;

    const callStack =
      typeof error === 'object' &&
      error !== null &&
      typeof error.stack === 'string'
        ? error.stack
            .split('\n')
            .slice(1)
            .join('\n')
        : null;

    return {
      callStack,
      errorMessage,
      hasError: true,
      isUnsupportedBridgeOperationError,
      isTimeout,
    };
  }

  componentDidCatch(error: any, {componentStack}: any) {
    this._logError(error, componentStack);
    this.setState({
      componentStack,
    });
  }

  componentDidMount() {
    const {store} = this.props;
    if (store != null) {
      store.addListener('error', this._onStoreError);
    }
  }

  componentWillUnmount() {
    const {store} = this.props;
    if (store != null) {
      store.removeListener('error', this._onStoreError);
    }
  }

  render() {
    const {canDismiss: canDismissProp, children} = this.props;
    const {
      callStack,
      canDismiss: canDismissState,
      componentStack,
      errorMessage,
      hasError,
      isUnsupportedBridgeOperationError,
      isTimeout,
    } = this.state;

    if (hasError) {
      if (isTimeout) {
        return (
          <TimeoutView
            callStack={callStack}
            componentStack={componentStack}
            dismissError={
              canDismissProp || canDismissState ? this._dismissError : null
            }
            errorMessage={errorMessage}
          />
        );
      } else if (isUnsupportedBridgeOperationError) {
        return (
          <UnsupportedBridgeOperationView
            callStack={callStack}
            componentStack={componentStack}
            errorMessage={errorMessage}
          />
        );
      } else {
        return (
          <ErrorView
            callStack={callStack}
            componentStack={componentStack}
            dismissError={
              canDismissProp || canDismissState ? this._dismissError : null
            }
            errorMessage={errorMessage}
            isUnsupportedBridgeOperationError={
              isUnsupportedBridgeOperationError
            }>
            <Suspense fallback={<SearchingGitHubIssues />}>
              <SuspendingErrorView
                callStack={callStack}
                componentStack={componentStack}
                errorMessage={errorMessage}
              />
            </Suspense>
          </ErrorView>
        );
      }
    }

    return children;
  }

  _logError = (error: any, componentStack: string | null) => {
    logEvent({
      event_name: 'error',
      error_message: error.message ?? null,
      error_stack: error.stack ?? null,
      error_component_stack: componentStack ?? null,
    });
  };

  _dismissError = () => {
    const onBeforeDismissCallback = this.props.onBeforeDismissCallback;
    if (typeof onBeforeDismissCallback === 'function') {
      onBeforeDismissCallback();
    }

    this.setState(InitialState);
  };

  _onStoreError = (error: Error) => {
    if (!this.state.hasError) {
      this._logError(error, null);
      this.setState({
        ...ErrorBoundary.getDerivedStateFromError(error),
        canDismiss: true,
      });
    }
  };
}
