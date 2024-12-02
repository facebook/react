// @enableChangeVariableCodegen
import {identity} from 'shared-runtime';

const $ = 'module_$';
const t0 = 'module_t0';
const c_0 = 'module_c_0';
function useFoo(props: {value: number}): number {
  const results = identity(props.value);
  console.log($);
  console.log(t0);
  console.log(c_0);
  return results;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{value: 0}],
};
