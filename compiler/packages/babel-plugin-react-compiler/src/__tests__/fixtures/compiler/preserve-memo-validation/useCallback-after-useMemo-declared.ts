// @validatePreserveExistingMemoizationGuarantees:true
import {useCallback, useMemo} from 'react';

/**
 * This is the corrected version where the useMemo is declared before
 * the useCallback that references it. This should compile without errors.
 */
function Component({value}) {
  // useMemo declared first
  const memoizedValue = useMemo(() => {
    return value * 2;
  }, [value]);

  // useCallback references the memoizedValue declared above
  const callback = useCallback(() => {
    return memoizedValue + 1;
  }, [memoizedValue]);

  return {callback, memoizedValue};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 5}],
};
