import {useMemo} from 'react';
import {
  typedCapture,
  typedCreateFrom,
  typedMutate,
  ValidateMemoization,
} from 'shared-runtime';

function Component({a, b}) {
  const x = useMemo(() => [{a}], [a, b]);
  let z: any;
  if (b) {
    z = x;
  } else {
    z = typedCapture(x);
  }
  // could mutate x
  typedMutate(z, b);

  return <ValidateMemoization inputs={[a, b]} output={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 0, b: 0},
    {a: 0, b: 1},
    {a: 1, b: 1},
    {a: 0, b: 0},
  ],
};
