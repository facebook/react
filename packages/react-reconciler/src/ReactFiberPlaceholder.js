/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

type Props = {|
  children: ReactNodeList,
|};

export function PlaceholderFallback(props: Props): ReactNodeList {
  return props.children;
}
