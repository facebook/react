/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {Octokit} from '@octokit/rest';

export type GitHubIssue = {|
  title: string,
  url: string,
|};

export async function searchGitHubIssues(
  message: string,
): Promise<GitHubIssue | null> {
  // Remove Fiber IDs from error message (as those will be unique).
  message = message.replace(/"[0-9]+"/g, '');

  const filters = [
    'in:title',
    'is:issue',
    'is:open',
    'is:public',
    'label:"Component: Developer Tools"',
    'repo:facebook/react',
  ];

  const octokit = new Octokit();
  const {data} = await octokit.search.issuesAndPullRequests({
    q: message + ' ' + filters.join(' '),
  });

  if (data.items.length > 0) {
    const item = data.items[0];
    return {
      title: item.title,
      url: item.html_url,
    };
  } else {
    return null;
  }
}
