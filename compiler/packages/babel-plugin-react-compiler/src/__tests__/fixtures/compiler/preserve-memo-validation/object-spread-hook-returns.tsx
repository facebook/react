import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function useConfig() {
  return {a: 1, b: 2, c: 3};
}

function Component() {
  const {...spread} = useConfig();

  const result = useMemo(() => {
    return spread.a + spread.b + spread.c;
  }, [spread.a, spread.b, spread.c]);

  return (
    <ValidateMemoization
      inputs={[spread.a, spread.b, spread.c]}
      output={result}
    />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};
