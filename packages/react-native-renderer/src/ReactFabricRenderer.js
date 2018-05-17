/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactFiberReconciler from 'react-reconciler';
import ReactFabricHostConfig from './ReactFabricHostConfig';

const ReactFabricRenderer = ReactFiberReconciler(ReactFabricHostConfig);

export default ReactFabricRenderer;
