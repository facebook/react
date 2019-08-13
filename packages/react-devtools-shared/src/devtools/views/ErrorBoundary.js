// @flow

import React, { Component } from 'react';
import styles from './ErrorBoundary.css';

type Props = {|
  children: React$Node,
|};

type State = {|
  callStack: string | null,
  componentStack: string | null,
  errorMessage: string | null,
  hasError: boolean,
|};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    callStack: null,
    componentStack: null,
    errorMessage: null,
    hasError: false,
  };

  componentDidCatch(error: any, { componentStack }: any) {
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
    const { children } = this.props;
    const { callStack, componentStack, errorMessage, hasError } = this.state;

    let bugURL = process.env.GITHUB_URL;
    if (bugURL) {
      const title = `Error: "${errorMessage || ''}"`;
      const label = '😭 bug';

      let body = '<!-- please provide repro information here -->\n';
      body += '\n---------------------------------------------';
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
        title
      )}&body=${encodeURI(body)}`;
    }

    if (hasError) {
      return (
        <div className={styles.ErrorBoundary}>
          <div className={styles.Header}>
            An error was thrown: "{errorMessage}"
          </div>
          {bugURL && (
            <a
              href={bugURL}
              rel="noopener noreferrer"
              target="_blank"
              title="Report bug"
            >
              Report this issue
            </a>
          )}
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
}
