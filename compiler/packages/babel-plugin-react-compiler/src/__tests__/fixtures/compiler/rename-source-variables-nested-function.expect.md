
## Input

```javascript
// @enableChangeVariableCodegen
import {identity} from 'shared-runtime';

const $ = 'module_$';
const t0 = 'module_t0';
const c_0 = 'module_c_0';
function useFoo(props: {value: number}): number {
  const a = () => {
    const b = () => {
      const c = () => {
        console.log($);
        console.log(t0);
        console.log(c_0);
        return identity(props.value);
      };
      return c;
    };
    return b;
  };
  return a()()();
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
  const $0 = _c(4);
  const c_00 = $0[0] !== props.value;
  let t1;
  if (c_00) {
    t1 = () => {
      const b = () => {
        const c = () => {
          console.log($);
          console.log(t0);
          console.log(c_0);
          return identity(props.value);
        };
        return c;
      };
      return b;
    };
    $0[0] = props.value;
    $0[1] = t1;
  } else {
    t1 = $0[1];
  }
  const a = t1;
  const c_2 = $0[2] !== a;
  let t2;
  if (c_2) {
    t2 = a()()();
    $0[2] = a;
    $0[3] = t2;
  } else {
    t2 = $0[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) 42
logs: ['module_$','module_t0','module_c_0']