/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {matchRoute} from './ServerRouter';
import AppRoutes from './AppRoutes';

// TODO: Replace with asset reference.
import Shell from '../client/Shell';

export default function App(props) {
  const match = matchRoute(props, AppRoutes);
  return <Shell>{match}</Shell>;
}
