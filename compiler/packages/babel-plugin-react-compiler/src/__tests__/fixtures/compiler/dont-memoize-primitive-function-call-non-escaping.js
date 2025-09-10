// @compilationMode:"infer" @enablePreserveExistingMemoizationGuarantees @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {makeObject_Primitives, ValidateMemoization} from 'shared-runtime';

function Component(props) {
  const result = makeObject(props.value).value + 1;
  console.log(result);
  return 'ok';
}

function makeObject(value) {
  console.log(value);
  return {value};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
  sequentialRenders: [
    {value: 42},
    {value: 42},
    {value: 3.14},
    {value: 3.14},
    {value: 42},
    {value: 3.14},
    {value: 42},
    {value: 3.14},
  ],
};
