// @flow

import React, { useCallback, useContext } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { StoreContext } from '../context';

export default function ClearProfilingDataButton() {
  const store = useContext(StoreContext);
  const clear = useCallback(() => store.clearProfilingData(), [store]);

  return (
    <Button
      disabled={!store.hasProfilingData}
      onClick={clear}
      title="Clear profiling data"
    >
      <ButtonIcon type="cancel" />
    </Button>
  );
}
