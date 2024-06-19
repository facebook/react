/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import ReactVersion from 'shared/ReactVersion';

type MarkupOptions = {
  identifierPrefix?: string,
};

export function renderToMarkup(
  children: ReactNodeList,
  options?: MarkupOptions,
): Promise<string> {
  return Promise.resolve('hi');
}

export {ReactVersion as version};
