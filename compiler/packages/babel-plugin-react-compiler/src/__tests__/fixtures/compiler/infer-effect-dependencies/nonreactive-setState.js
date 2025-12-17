// @inferEffectDependencies
import {useEffect, useState, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

/**
 * Special case of `infer-effect-deps/nonreactive-dep`.
 *
 * We know that local `useRef` return values are stable, regardless of
 * inferred memoization.
 */
function NonReactiveSetStateInEffect() {
  const [_, setState] = useState('initial value');
  useEffect(() => print(setState), AUTODEPS);
}
