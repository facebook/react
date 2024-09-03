import {useMemo} from 'react';
import {
  useArrayConcatNotTypedAsHook,
  ValidateMemoization,
} from 'shared-runtime';

export function Component({a, b}) {
  const item1 = useMemo(() => [a], [a]);
  const item2 = useMemo(() => [b], [b]);
  const item3 = useArrayConcatNotTypedAsHook(item1, item2);

  return (
    <>
      <ValidateMemoization inputs={[a, b]} output={item3} />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 0, b: 0},
    {a: 1, b: 0},
    {a: 1, b: 1},
    {a: 1, b: 2},
    {a: 2, b: 2},
    {a: 3, b: 2},
    {a: 0, b: 0},
  ],
};
