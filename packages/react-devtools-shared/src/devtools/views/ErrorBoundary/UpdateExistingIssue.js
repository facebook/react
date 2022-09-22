/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {GitHubIssue} from './githubAPI';

import * as React from 'react';
import Icon from '../Icon';
import styles from './shared.css';

export default function UpdateExistingIssue({
  gitHubIssue,
}: {
  gitHubIssue: GitHubIssue,
}): React.Node {
  const {title, url} = gitHubIssue;
  return (
    <div className={styles.GitHubLinkRow}>
      <Icon className={styles.ReportIcon} type="bug" />
      <div className={styles.UpdateExistingIssuePrompt}>
        Update existing issue:
      </div>
      <a
        className={styles.ReportLink}
        href={url}
        rel="noopener noreferrer"
        target="_blank"
        title="Report bug">
        {title}
      </a>
    </div>
  );
}
