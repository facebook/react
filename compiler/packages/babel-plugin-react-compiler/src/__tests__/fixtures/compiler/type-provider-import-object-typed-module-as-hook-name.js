import {useMemo} from 'react';
import useHook from 'shared-runtime';

export function Component({a, b}) {
  const item1 = useMemo(() => ({a}), [a]);
  const item2 = useMemo(() => ({b}), [b]);
  useHook(item1, item2);

  return (
    <>
      <ValidateMemoization inputs={[a]} output={item1} />
      <ValidateMemoization inputs={[b]} output={item2} />
    </>
  );
}
