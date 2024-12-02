// @inferEffectDependencies
import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

/**
 * Special case of `infer-effect-deps/nonreactive-dep`.
 *
 * We know that local `useRef` return values are stable, regardless of
 * inferred memoization.
 */
function NonReactiveRefInEffect() {
  const ref = useRef('initial value');
  useEffect(() => print(ref.current));
}
