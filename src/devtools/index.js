// @flow

import Bridge from 'src/bridge';

type Shell = {|
  connect: (callback: Function) => void,
  onReload: (reloadFn: Function) => void,
|};

export function initDevTools(shell: Shell) {
  shell.connect((bridge: Bridge) => {
    // TODO ...
  });
}
