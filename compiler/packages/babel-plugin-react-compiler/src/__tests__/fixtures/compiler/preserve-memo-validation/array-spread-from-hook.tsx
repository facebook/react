import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function useData() {
  return ['a', 'b', 'c'];
}

function Component() {
  const [first, ...rest] = useData();

  const result = useMemo(() => {
    return rest.join('-');
  }, [rest]);

  return <ValidateMemoization inputs={[rest]} output={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};
