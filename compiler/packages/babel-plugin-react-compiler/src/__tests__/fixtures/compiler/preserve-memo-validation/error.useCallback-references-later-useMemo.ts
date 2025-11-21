// @validatePreserveExistingMemoizationGuarantees:true
import {useCallback, useMemo} from 'react';

/**
 * Issue: When a useCallback references a value from a useMemo that is
 * declared later in the component, the compiler triggers a false positive
 * preserve-manual-memoization error.
 *
 * The error occurs because the validation checks that dependencies have
 * completed their scope before the manual memo block starts. However,
 * when the callback is declared before the useMemo, the useMemo's scope
 * hasn't completed yet.
 *
 * This is a valid pattern in React - declaration order doesn't matter
 * for the runtime behavior since both are memoized.
 */
function Component({value}) {
  // This callback references `memoizedValue` which is declared later
  const callback = useCallback(() => {
    return memoizedValue + 1;
  }, [memoizedValue]);

  // This useMemo is declared after the callback that uses it
  const memoizedValue = useMemo(() => {
    return value * 2;
  }, [value]);

  return {callback, memoizedValue};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 5}],
};
