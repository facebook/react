// @flow

import React, { useCallback, useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { StoreContext } from '../context';

export default function ClearProfilingDataButton() {
  const store = useContext(StoreContext);
  const { didRecordCommits, isProfiling } = useContext(ProfilerContext);
  const { profilerStore } = store;

  const clear = useCallback(() => profilerStore.clear(), [profilerStore]);

  return (
    <Button
      disabled={isProfiling || !didRecordCommits}
      onClick={clear}
      title="Clear profiling data"
    >
      <ButtonIcon type="clear" />
    </Button>
  );
}
