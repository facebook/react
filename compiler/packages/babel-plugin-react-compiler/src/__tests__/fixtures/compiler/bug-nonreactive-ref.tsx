import {useRef} from 'react';
import {Stringify} from 'shared-runtime';

/**
 * Bug: we're currently filtering out `ref.current` dependencies in
 * `propagateScopeDependencies:checkValidDependency`. This is incorrect.
 * Instead, we should always take a dependency on ref values (the outer box) as
 * they may be reactive. Pruning should be done in
 * `pruneNonReactiveDependencies`
 *
 * Found differences in evaluator results
 * Non-forget (expected):
 *   (kind: ok)
 *   <div>{"cb":{"kind":"Function","result":1},"shouldInvokeFns":true}</div>
 *   <div>{"cb":{"kind":"Function","result":2},"shouldInvokeFns":true}</div>
 * Forget:
 *   (kind: ok)
 *   <div>{"cb":{"kind":"Function","result":1},"shouldInvokeFns":true}</div>
 *   <div>{"cb":{"kind":"Function","result":1},"shouldInvokeFns":true}</div>
 */
function Component({cond}) {
  const ref1 = useRef(1);
  const ref2 = useRef(2);
  const ref = cond ? ref1 : ref2;
  const cb = () => ref.current;
  return <Stringify cb={cb} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{cond: true}],
  sequentialRenders: [{cond: true}, {cond: false}],
};
