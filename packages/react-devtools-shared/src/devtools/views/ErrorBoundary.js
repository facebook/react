/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Component} from 'react';
import Button from './Button';
import ButtonIcon from './ButtonIcon';
import Icon from './Icon';
import styles from './ErrorBoundary.css';
import Store from 'react-devtools-shared/src/devtools/store';

type Props = {|
  children: React$Node,
  onRetry?: (store: Store) => void,
  store: Store,
|};

type State = {|
  callStack: string | null,
  componentStack: string | null,
  errorMessage: string | null,
  hasError: boolean,
|};

const InitialState: State = {
  callStack: null,
  componentStack: null,
  errorMessage: null,
  hasError: false,
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = InitialState;

  componentDidCatch(error: any, {componentStack}: any) {
    const errorMessage =
      typeof error === 'object' && error.hasOwnProperty('message')
        ? error.message
        : error;

    const callStack =
      typeof error === 'object' && error.hasOwnProperty('stack')
        ? error.stack
            .split('\n')
            .slice(1)
            .join('\n')
        : null;

    this.setState({
      callStack,
      componentStack,
      errorMessage,
      hasError: true,
    });
  }

  render() {
    const {children} = this.props;
    const {callStack, componentStack, errorMessage, hasError} = this.state;

    let bugURL = process.env.GITHUB_URL;
    if (bugURL) {
      const title = `Error: "${errorMessage || ''}"`;
      const label = 'Component: Developer Tools';

      let body = 'Describe what you were doing when the bug occurred:';
      body += '\n1. ';
      body += '\n2. ';
      body += '\n3. ';
      body += '\n\n---------------------------------------------';
      body += '\nPlease do not remove the text below this line';
      body += '\n---------------------------------------------';
      body += `\n\nDevTools version: ${process.env.DEVTOOLS_VERSION || ''}`;
      if (callStack) {
        body += `\n\nCall stack: ${callStack.trim()}`;
      }
      if (componentStack) {
        body += `\n\nComponent stack: ${componentStack.trim()}`;
      }

      bugURL += `/issues/new?labels=${encodeURI(label)}&title=${encodeURI(
        title,
      )}&body=${encodeURI(body)}`;
    }

    if (hasError) {
      return (
        <div className={styles.ErrorBoundary}>
          <div className={styles.Header}>
            Uncaught Error: {errorMessage || ''}
          </div>
          <div className={styles.IconAndLinkRow}>
            <Button
              className={styles.RetryButton}
              title="Retry"
              onClick={this.handleRetry}>
              <ButtonIcon className={styles.RetryIcon} type="reload" />
              Retry
            </Button>
            {bugURL && (
              <>
                <Icon className={styles.ReportIcon} type="bug" />
                <a
                  className={styles.ReportLink}
                  href={bugURL}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Report bug">
                  Report this issue
                </a>
              </>
            )}
          </div>
          {!!callStack && (
            <div className={styles.Stack}>
              The error was thrown {callStack.trim()}
            </div>
          )}
          {!!componentStack && (
            <div className={styles.Stack}>
              The error occurred {componentStack.trim()}
            </div>
          )}
        </div>
      );
    }

    return children;
  }

  handleRetry = () => {
    const {onRetry, store} = this.props;
    if (typeof onRetry === 'function') {
      onRetry(store);
    }

    this.setState(InitialState);
  };
}
