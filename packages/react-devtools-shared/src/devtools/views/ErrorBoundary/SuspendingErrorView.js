/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {findGitHubIssue} from './cache';
import UpdateExistingIssue from './UpdateExistingIssue';
import ReportNewIssue from './ReportNewIssue';
import WorkplaceGroup from './WorkplaceGroup';

type Props = {
  callStack: string | null,
  componentStack: string | null,
  errorMessage: string | null,
};

export default function SuspendingErrorView({
  callStack,
  componentStack,
  errorMessage,
}: Props): React.Node {
  const maybeItem =
    errorMessage !== null ? findGitHubIssue(errorMessage) : null;

  let GitHubUI;
  if (maybeItem != null) {
    GitHubUI = <UpdateExistingIssue gitHubIssue={maybeItem} />;
  } else {
    GitHubUI = (
      <ReportNewIssue
        callStack={callStack}
        componentStack={componentStack}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <>
      {GitHubUI}
      <WorkplaceGroup />
    </>
  );
}
