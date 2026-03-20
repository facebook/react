
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Bug: Closure passed as JSX prop accesses nullable state. The compiler hoists
 * `data.value` into a cache key that crashes because data could be null.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component({data}: {data: {value: string} | null}) {
  const onData = () => {
    console.log(data.value);
  };
  return <Stringify onData={onData}>{data?.value}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{data: {value: 'hello'}}],
  sequentialRenders: [{data: {value: 'hello'}}, {data: {value: 'world'}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Bug: Closure passed as JSX prop accesses nullable state. The compiler hoists
 * `data.value` into a cache key that crashes because data could be null.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component(t0) {
  const $ = _c(5);
  const { data } = t0;
  let t1;
  if ($[0] !== data) {
    t1 = () => {
      console.log(data.value);
    };
    $[0] = data;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const onData = t1;

  const t2 = data?.value;
  let t3;
  if ($[2] !== onData || $[3] !== t2) {
    t3 = <Stringify onData={onData}>{t2}</Stringify>;
    $[2] = onData;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ data: { value: "hello" } }],
  sequentialRenders: [
    { data: { value: "hello" } },
    { data: { value: "world" } },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"onData":"[[ function params=0 ]]","children":"hello"}</div>
<div>{"onData":"[[ function params=0 ]]","children":"world"}</div>