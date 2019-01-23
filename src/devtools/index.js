// @flow

import type { Bridge } from '../types';

type Shell = {|
  connect: (callback: Function) => void,
  onReload: (reloadFn: Function) => void,
|};

export function initDevTools(shell: Shell) {
  shell.connect((bridge: Bridge) => {
    // TODO ...
  });
}
