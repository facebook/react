/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import LoadingAnimation from 'react-devtools-shared/src/devtools/views/Components/LoadingAnimation';
import styles from './shared.css';

export default function SearchingGitHubIssues(): React.Node {
  return (
    <div className={styles.GitHubLinkRow}>
      <LoadingAnimation className={styles.LoadingIcon} />
      Searching GitHub for reports of this error...
    </div>
  );
}
