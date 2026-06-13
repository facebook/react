import {Stringify} from 'shared-runtime';

/**
 * Bug: TypeScript assertion function pattern. `planPeriod.id` after the
 * assertion is used as a cache key, crashing when planPeriod is null.
 * The compiler doesn't understand that the assertion narrows the type.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function assertIsNotEmpty<TValue>(
  value: TValue | null | undefined
): asserts value is TValue {
  if (value == null) throw new Error('assertion failure');
}

function Component({
  planPeriod,
}: {
  planPeriod: {id: string} | null;
}) {
  const callback = () => {
    assertIsNotEmpty(planPeriod?.id);
    console.log(planPeriod.id);
  };
  return <Stringify onClick={callback} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{planPeriod: {id: 'p1'}}],
  sequentialRenders: [{planPeriod: {id: 'p1'}}, {planPeriod: {id: 'p2'}}],
};
