/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import Icon from '../Icon';
import styles from './shared.css';

type Props = {|
  callStack: string | null,
  componentStack: string | null,
  errorMessage: string | null,
|};

export default function ReportNewIssue({
  callStack,
  componentStack,
  errorMessage,
}: Props) {
  let bugURL = process.env.GITHUB_URL;
  if (!bugURL) {
    return null;
  }

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

  return (
    <div className={styles.GitHubLinkRow}>
      <Icon className={styles.ReportIcon} type="bug" />
      <a
        className={styles.ReportLink}
        href={bugURL}
        rel="noopener noreferrer"
        target="_blank"
        title="Report bug">
        Report this issue
      </a>
      <div className={styles.ReproSteps}>
        (Please include steps on how to reproduce it and the components used.)
      </div>
    </div>
  );
}
