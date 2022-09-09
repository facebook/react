/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

type Shell = {
  connect: (callback: Function) => void,
  onReload: (reloadFn: Function) => void,
};

export function initDevTools(shell: Shell) {
  shell.connect((bridge: FrontendBridge) => {
    // TODO ...
  });
}
