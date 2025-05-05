// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

/**
 * We never include a .current access in a dep array because it may be a ref access.
 * This might over-capture objects that are not refs and happen to have fields named
 * current, but that should be a rare case and the result would still be correct
 * (assuming the effect is idempotent). In the worst case, you can always write a manual
 * dep array.
 */
function RefsInEffects() {
  const ref = useRefHelper();
  const wrapped = useDeeperRefHelper();
  useEffect(() => {
    print(ref.current);
    print(wrapped.foo.current);
  });
}

function useRefHelper() {
  return useRef(0);
}

function useDeeperRefHelper() {
  return {foo: useRefHelper()};
}
