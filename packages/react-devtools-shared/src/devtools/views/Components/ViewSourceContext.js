/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import {createContext} from 'react';

import type {ViewUrlSource} from 'react-devtools-shared/src/devtools/views/DevTools';

export type Context = {
  viewUrlSourceFunction: ViewUrlSource | null,
};

const ViewSourceContext: ReactContext<Context> = createContext<Context>(
  ((null: any): Context),
);
ViewSourceContext.displayName = 'ViewSourceContext';

export default ViewSourceContext;
