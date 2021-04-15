/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

type Props = {|
  callStack: string | null,
  componentStack: string | null,
  errorMessage: string | null,
|};

export default function SuspendingErrorView({
  callStack,
  componentStack,
  errorMessage,
}: Props) {
  const maybeItem =
    errorMessage !== null ? findGitHubIssue(errorMessage) : null;
  if (maybeItem != null) {
    return <UpdateExistingIssue gitHubIssue={maybeItem} />;
  } else {
    return (
      <ReportNewIssue
        callStack={callStack}
        componentStack={componentStack}
        errorMessage={errorMessage}
      />
    );
  }
}
