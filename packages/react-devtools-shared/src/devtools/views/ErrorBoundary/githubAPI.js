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
  message = message.replace(/"[0-9]+"/, '');

  const filters = [
    // Unfortunately "repo" and "org" filters don't work
    // Hopefully the label filter will be sufficient.
    'in:title',
    'is:issue',
    'is:open',
    'is:public',
    'label:"Component: Developer Tools"',
  ];

  const octokit = new Octokit();
  const {data} = await octokit.search.issuesAndPullRequests({
    q: message + ' ' + filters.join(' '),
  });

  const maybeItem = data.items.find(item =>
    item.html_url.startsWith('https://github.com/facebook/react/'),
  );

  if (maybeItem) {
    return {
      title: maybeItem.title,
      url: maybeItem.html_url,
    };
  } else {
    return null;
  }
}
