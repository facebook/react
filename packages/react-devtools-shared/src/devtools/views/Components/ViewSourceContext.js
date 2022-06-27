/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createContext} from 'react';

import type {ViewSourceLine} from 'react-devtools-shared/src/devtools/views/DevTools';

export type Context = {|
  viewSourceLineFunction: ViewSourceLine | null,
|};

const ViewSourceContext = createContext<Context>(((null: any): Context));
ViewSourceContext.displayName = 'ViewSourceContext';

export default ViewSourceContext;
