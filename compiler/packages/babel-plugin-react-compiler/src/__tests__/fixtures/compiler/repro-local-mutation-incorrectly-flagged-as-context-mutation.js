// @validateNoFreezingKnownMutableFunctions

import {useCallback, useEffect, useRef} from 'react';
import {useHook} from 'shared-runtime';

function Component() {
  const params = useHook();
  const update = useCallback(
    partialParams => {
      const nextParams = {
        ...params,
        ...partialParams,
      };
      // Due to how we previously represented ObjectExpressions in InferReferenceEffects,
      // this was recorded as a mutation of a context value (`params`) which then made
      // the function appear ineligible for freezing when passing to useEffect below.
      nextParams.param = 'value';
      console.log(nextParams);
    },
    [params]
  );
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current === null) {
      update();
    }
  }, [update]);

  return 'ok';
}
