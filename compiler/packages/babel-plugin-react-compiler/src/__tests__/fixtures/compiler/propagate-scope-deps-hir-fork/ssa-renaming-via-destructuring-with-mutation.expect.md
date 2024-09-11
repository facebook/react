
## Input

```javascript
// @enablePropagateDepsInHIR
import {mutate} from 'shared-runtime';

function useFoo(props) {
  let {x} = {x: []};
  x.push(props.bar);
  if (props.cond) {
    ({x} = {x: {}});
    ({x} = {x: []});
    x.push(props.foo);
  }
  mutate(x);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{bar: 'bar', foo: 'foo', cond: true}],
  sequentialRenders: [
    {bar: 'bar', foo: 'foo', cond: true},
    {bar: 'bar', foo: 'foo', cond: true},
    {bar: 'bar', foo: 'foo', cond: false},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePropagateDepsInHIR
import { mutate } from "shared-runtime";

function useFoo(props) {
  const $ = _c(2);
  let x;
  if ($[0] !== props) {
    ({ x } = { x: [] });
    x.push(props.bar);
    if (props.cond) {
      ({ x } = { x: [] });
      x.push(props.foo);
    }

    mutate(x);
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ bar: "bar", foo: "foo", cond: true }],
  sequentialRenders: [
    { bar: "bar", foo: "foo", cond: true },
    { bar: "bar", foo: "foo", cond: true },
    { bar: "bar", foo: "foo", cond: false },
  ],
};

```
      
### Eval output
(kind: ok) ["foo","joe"]
["foo","joe"]
["bar","joe"]