// @validatePreserveExistingMemoizationGuarantees:true

import {useRef, useMemo} from 'react';
import {makeArray} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render.
 */
function useFoo() {
  const r = useRef();
  return useMemo(() => makeArray(r), []);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};
