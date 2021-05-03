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

function encodeURIWrapper(string: string): string {
  return encodeURI(string).replace(/#/g, '%23');
}

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
  const labels = ['Component: Developer Tools', 'Status: Unconfirmed'];

  const body = `
<!-- Please answer both questions below before submitting this issue. -->

### Which website or app were you using when the bug happened?

Please provide a link to the URL of the website (if it is public), a CodeSandbox (https://codesandbox.io/s/new) example that reproduces the bug, or a project on GitHub that we can checkout and run locally.

### What were you doing on the website or app when the bug happened?

If possible, please describe how to reproduce this bug on the website or app mentioned above:
1. <!-- FILL THIS IN -->
2. <!-- FILL THIS IN -->
3. <!-- FILL THIS IN -->

<!--------------------------------------------------->
<!-- Please do not remove the text below this line -->
<!--------------------------------------------------->

### Generated information

DevTools version: ${process.env.DEVTOOLS_VERSION || ''}

Call stack:
${callStack || '(not available)'}

Component stack:
${componentStack || '(not available)'}
  `;

  bugURL += `/issues/new?labels=${encodeURIWrapper(
    labels.join(','),
  )}&title=${encodeURIWrapper(title)}&body=${encodeURIWrapper(body.trim())}`;

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
