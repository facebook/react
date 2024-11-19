// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';

function useHook(maybeRef) {
  return useMemo(() => {
    return () => [maybeRef.current];
  }, [maybeRef]);
}
