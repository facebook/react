
## Input

```javascript
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

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableChangeVariableCodegen
import { identity } from "shared-runtime";

const $ = "module_$";
const t0 = "module_t0";
const c_0 = "module_c_0";
function useFoo(props) {
  const $0 = _c(2);
  const c_00 = $0[0] !== props.value;
  let t1;
  if (c_00) {
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

    t1 = a.foo().bar();
    $0[0] = props.value;
    $0[1] = t1;
  } else {
    t1 = $0[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) 42
logs: ['module_$','module_t0','module_c_0']