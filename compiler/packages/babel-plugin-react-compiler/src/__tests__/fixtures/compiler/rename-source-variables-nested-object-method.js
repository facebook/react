// @enableChangeVariableCodegen
import {identity} from 'shared-runtime';

const $ = 'module_$';
const t0 = 'module_t0';
const c_0 = 'module_c_0';
function useFoo(props: {value: number}): number {
  const a = {
    foo() {
      const b = {
        bar() {
          console.log($);
          console.log(t0);
          console.log(c_0);
          return identity(props.value);
        },
      };
      return b;
    },
  };
  return a.foo().bar();
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{value: 42}],
};
