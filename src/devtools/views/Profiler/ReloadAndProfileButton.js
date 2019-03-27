// @flow

import React, { useCallback, useContext } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { BridgeContext, StoreContext } from '../context';

export default function ReloadAndProfileButton() {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const reloadAndProfile = useCallback(() => bridge.send('reloadAndProfile'), [
    bridge,
  ]);

  if (!store.supportsReloadAndProfile) {
    return null;
  }

  return (
    <Button
      disabled={!store.supportsProfiling}
      onClick={reloadAndProfile}
      title="Reload and start profiling"
    >
      <ButtonIcon type="reload" />
    </Button>
  );
}
