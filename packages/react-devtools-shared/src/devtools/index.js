// @flow

import type { FrontendBridge } from 'src/bridge';

type Shell = {|
  connect: (callback: Function) => void,
  onReload: (reloadFn: Function) => void,
|};

export function initDevTools(shell: Shell) {
  shell.connect((bridge: FrontendBridge) => {
    // TODO ...
  });
}
