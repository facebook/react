
## Input

```javascript
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
    t1 = identity(props.value);
    $0[0] = props.value;
    $0[1] = t1;
  } else {
    t1 = $0[1];
  }
  const results = t1;
  console.log($);
  console.log(t0);
  console.log(c_0);
  return results;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: 0 }],
};

```
      
### Eval output
(kind: ok) 0
logs: ['module_$','module_t0','module_c_0']