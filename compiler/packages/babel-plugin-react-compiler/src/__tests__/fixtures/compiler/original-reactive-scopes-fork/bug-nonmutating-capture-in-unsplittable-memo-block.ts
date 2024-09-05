// @enableReactiveScopesInHIR:false
import {identity, mutate} from 'shared-runtime';

/**
 * The root cause of this bug is in `InferReactiveScopeVariables`. Currently,
 * InferReactiveScopeVariables do not ensure that maybe-aliased values get
 * assigned the same reactive scope. This is safe only when an already-
 * constructed value is captured, e.g.
 * ```js
 * const x = makeObj();  ⌝ mutable range of x
 * mutate(x);            ⌟
 *                       <-- after this point, we can produce a canonical version
 *                           of x for all following aliases
 * const y = [];
 * y.push(x);            <-- y captures x
 * ```
 *
 * However, if a value is captured/aliased during its mutable range and the
 * capturing container is separately memoized, it becomes difficult to guarantee
 * that all aliases refer to the same value.
 *
 * Sprout error:
 * Found differences in evaluator results
 * Non-forget (expected):
 * (kind: ok) [{"wat0":"joe"},3]
 * [{"wat0":"joe"},3]
 * Forget:
 * (kind: ok) [{"wat0":"joe"},3]
 * [[ (exception in render) Error: oh no! ]]
 *
 */
function useFoo({a, b}) {
  const x = {a};
  const y = {};
  mutate(x);
  const z = [identity(y), b];
  mutate(y);

  if (z[0] !== y) {
    throw new Error('oh no!');
  }
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: 2, b: 3}],
  sequentialRenders: [
    {a: 2, b: 3},
    {a: 4, b: 3},
  ],
};
