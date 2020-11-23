import * as React from 'react';

import {RefreshContext} from './Context.client';

export default function useMutation(performMutation) {
  const [pendingCount, setPendingCount] = React.useState(0);
  const [startTransition, isTransitioning] = React.unstable_useTransition();
  const refresh = React.useContext(RefreshContext);

  async function handleMutation(...args) {
    setPendingCount(c => c + 1);
    try {
      await performMutation(...args);
    } finally {
      setPendingCount(c => c - 1);
    }
    startTransition(() => {
      refresh();
    });
  }

  return [handleMutation, pendingCount > 0 || isTransitioning];
}
