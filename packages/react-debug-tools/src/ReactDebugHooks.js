/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {parse} from 'error-stack-parser';

type HooksTree = {};

export function inspectHooks<Props>(
  renderFunction: Props => React$Node,
  props: Props,
): HooksTree {
  return {
    data: parse(new Error()),
  };
}
