/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createContext} from 'react';

const TreeFocusedContext = createContext<boolean>(false);

export default TreeFocusedContext;
