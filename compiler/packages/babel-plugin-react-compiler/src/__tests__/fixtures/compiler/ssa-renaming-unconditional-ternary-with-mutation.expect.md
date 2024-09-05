
## Input

```javascript
import {arrayPush} from 'shared-runtime';
function foo(props) {
  let x = [];
  x.push(props.bar);
  props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  arrayPush(x, 4);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{cond: false, foo: 2, bar: 55}],
  sequentialRenders: [
    {cond: false, foo: 2, bar: 55},
    {cond: false, foo: 3, bar: 55},
    {cond: true, foo: 3, bar: 55},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { arrayPush } from "shared-runtime";
function foo(props) {
  const $ = _c(2);
  let x;
  if ($[0] !== props) {
    x = [];
    x.push(props.bar);
    props.cond ? ((x = []), x.push(props.foo)) : ((x = []), x.push(props.bar));
    arrayPush(x, 4);
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{ cond: false, foo: 2, bar: 55 }],
  sequentialRenders: [
    { cond: false, foo: 2, bar: 55 },
    { cond: false, foo: 3, bar: 55 },
    { cond: true, foo: 3, bar: 55 },
  ],
};

```
      
### Eval output
(kind: ok) [55,4]
[55,4]
[3,4]