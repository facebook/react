/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

type GlobalRoot = {
  isMounted: boolean,
  setContext<T>(
    context: ReactContext<T>,
    oldVvalue: T,
    newValue: T,
    callback: (T) => mixed,
  ): void,
  previousGlobalRoot: GlobalRoot | null,
  nextGlobalRoot: GlobalRoot | null,
};

const ReactRootList = {
  first: (null: GlobalRoot | null),
  last: (null: GlobalRoot | null),
};

export default ReactRootList;
