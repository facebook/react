import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function Component({...props}: {value: string}) {
  const result = useMemo(() => {
    return props.value.toUpperCase();
  }, [props.value]);

  return <ValidateMemoization inputs={[props.value]} output={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'test'}],
  sequentialRenders: [{value: 'test'}, {value: 'test'}, {value: 'changed'}],
  isComponent: true,
};
