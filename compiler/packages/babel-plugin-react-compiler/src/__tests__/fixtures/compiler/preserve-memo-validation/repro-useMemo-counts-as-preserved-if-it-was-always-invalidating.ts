// @validatePreserveExistingMemoizationGuarantees

import {useMemo} from 'react';
import {useHook} from 'shared-runtime';

// If we can prove that a useMemo was ineffective because it would always invalidate,
// then we shouldn't throw a "couldn't preserve existing memoization" error
// TODO: consider reporting a separate error to the user for this case, if you're going
// to memoize manually, then you probably want to know that it's a no-op
function useFoo(props) {
  const x = [];
  useHook();
  x.push(props);

  return useMemo(() => [x], [x]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{}],
};
