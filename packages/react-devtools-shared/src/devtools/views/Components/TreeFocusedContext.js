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

const TreeFocusedContext: ReactContext<boolean> = createContext<boolean>(false);

export default TreeFocusedContext;
