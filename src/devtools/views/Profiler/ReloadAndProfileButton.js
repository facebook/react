// @flow

import React, { useCallback, useContext, useMemo } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { BridgeContext, StoreContext } from '../context';
import { useSubscription } from '../hooks';
import Store from 'src/devtools/store';

type SubscriptionData = {|
  recordChangeDescriptions: boolean,
  supportsReloadAndProfile: boolean,
|};

export default function ReloadAndProfileButton() {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const subscription = useMemo(
    () => ({
      getCurrentValue: () => ({
        recordChangeDescriptions: store.recordChangeDescriptions,
        supportsReloadAndProfile: store.supportsReloadAndProfile,
      }),
      subscribe: (callback: Function) => {
        store.addListener('recordChangeDescriptions', callback);
        store.addListener('supportsReloadAndProfile', callback);
        return () => {
          store.removeListener('recordChangeDescriptions', callback);
          store.removeListener('supportsReloadAndProfile', callback);
        };
      },
    }),
    [store]
  );
  const {
    recordChangeDescriptions,
    supportsReloadAndProfile,
  } = useSubscription<SubscriptionData, Store>(subscription);

  const reloadAndProfile = useCallback(
    () => bridge.send('reloadAndProfile', recordChangeDescriptions),
    [bridge, recordChangeDescriptions]
  );

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
