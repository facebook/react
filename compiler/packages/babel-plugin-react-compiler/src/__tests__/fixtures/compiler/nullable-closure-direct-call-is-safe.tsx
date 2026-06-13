import {Stringify} from 'shared-runtime';

/**
 * Correctness guard: When a closure is directly called during render,
 * it executes synchronously and its property accesses prove non-nullness.
 * The cache key should remain `obj.value` (non-optional). This fixture
 * must NOT change after the nullable-closure fix.
 */
function Component({obj}: {obj: {value: number}}) {
  const getValue = () => obj.value;
  const value = getValue();
  return <Stringify>{value}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{obj: {value: 1}}],
  sequentialRenders: [{obj: {value: 1}}, {obj: {value: 2}}],
};
