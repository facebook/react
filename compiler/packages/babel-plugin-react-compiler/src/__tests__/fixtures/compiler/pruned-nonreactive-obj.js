// @inferEffectDependencies
import {useIdentity, mutate, makeObject} from 'shared-runtime';
import {useEffect} from 'react';

/**
 * When a semantically non-reactive value has a pruned scope (i.e. the object
 * identity becomes reactive, but the underlying value it represents should be
 * constant), the compiler can choose to either
 * - add it as a dependency (and rerun the effect)
 * - not add it as a dependency
 *
 * We keep semantically non-reactive values in both memo block and effect
 * dependency arrays to avoid versioning invariants e.g. `x !== y.aliasedX`.
 * ```js
 * function Component() {
 *   // obj is semantically non-reactive, but its memo scope is pruned due to
 *   // the interleaving hook call
 *   const obj = {};
 *   useHook();
 *   write(obj);
 *
 *   const ref = useRef();
 *
 *   // this effect needs to be rerun when obj's referential identity changes,
 *   // because it might alias obj to a useRef / mutable store.
 *   useEffect(() => ref.current = obj, ???);
 *
 *   // in a custom hook (or child component), the user might expect versioning
 *   // invariants to hold
 *   useHook(ref, obj);
 * }
 *
 * // defined elsewhere
 * function useHook(someRef, obj) {
 *   useEffect(
 *     () => assert(someRef.current === obj),
 *     [someRef, obj]
 *   );
 * }
 * ```
 */
function PrunedNonReactive() {
  const obj = makeObject();
  useIdentity(null);
  mutate(obj);

  useEffect(() => print(obj.value));
}
