// @flow

import React, { useCallback, useContext, useMemo } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { BridgeContext, StoreContext } from '../context';
import { useSubscription } from '../hooks';
import Store from 'src/devtools/store';

export default function ReloadAndProfileButton() {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const supportsReloadAndProfileSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.supportsReloadAndProfile,
      subscribe: (callback: Function) => {
        store.addListener('supportsReloadAndProfile', callback);
        return () => store.removeListener('supportsReloadAndProfile', callback);
      },
    }),
    [store]
  );
  const supportsReloadAndProfile = useSubscription<boolean, Store>(
    supportsReloadAndProfileSubscription
  );

  const reloadAndProfile = useCallback(() => bridge.send('reloadAndProfile'), [
    bridge,
  ]);

  if (!supportsReloadAndProfile) {
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
