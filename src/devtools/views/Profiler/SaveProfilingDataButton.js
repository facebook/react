// @flow

import React, { useContext, useCallback } from 'react';
import { ProfilerContext } from './ProfilerContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { BridgeContext, StoreContext } from '../context';

export default function SaveProfilingDataButton() {
  const bridge = useContext(BridgeContext);
  const { isProfiling, rendererID, rootHasProfilingData, rootID } = useContext(
    ProfilerContext
  );
  const store = useContext(StoreContext);

  const saveProfiler = useCallback(() => {
    bridge.send('downloadProfilingSummary', { rendererID, rootID });
  }, [bridge, rendererID, rootID]);

  if (!store.supportsDownloads) {
    return null;
  }

  return (
    <Button
      disabled={isProfiling || !rootHasProfilingData}
      onClick={saveProfiler}
      title="Save profile..."
    >
      <ButtonIcon type="download" />
    </Button>
  );
}
