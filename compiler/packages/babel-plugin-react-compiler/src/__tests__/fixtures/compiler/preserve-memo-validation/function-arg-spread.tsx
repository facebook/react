import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function Component({...data}: {x: number; y: number}) {
  const result = useMemo(() => {
    return data.x + data.y;
  }, [data.x, data.y]);

  return <ValidateMemoization inputs={[data.x, data.y]} output={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: 10, y: 20}],
  sequentialRenders: [
    {x: 10, y: 20},
    {x: 10, y: 20},
    {x: 15, y: 25},
  ],
  isComponent: true,
};
