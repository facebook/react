// @inferEffectDependencies @panicThreshold:"none"
import {useRef} from 'react';
import {useSpecialEffect} from 'shared-runtime';

/**
 * The retry pipeline disables memoization features, which means we need to
 * provide an alternate implementation of effect dependencies which does not
 * rely on memoization.
 */
function useFoo({cond}) {
  const ref = useRef();
  const derived = cond ? ref.current : makeObject();
  useSpecialEffect(() => {
    log(derived);
  }, [derived]);
  return ref;
}
