
## Input

```javascript
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

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { ValidateMemoization } from "shared-runtime";

function Component(t0) {
  const $ = _c(8);
  let props;
  let t1;
  if ($[0] !== t0) {
    ({ ...props } = t0);

    t1 = props.value.toUpperCase();
    $[0] = t0;
    $[1] = props;
    $[2] = t1;
  } else {
    props = $[1];
    t1 = $[2];
  }
  const result = t1;
  let t2;
  if ($[3] !== props.value) {
    t2 = [props.value];
    $[3] = props.value;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== result || $[6] !== t2) {
    t3 = <ValidateMemoization inputs={t2} output={result} />;
    $[5] = result;
    $[6] = t2;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "test" }],
  sequentialRenders: [
    { value: "test" },
    { value: "test" },
    { value: "changed" },
  ],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>{"inputs":["test"],"output":"TEST"}</div>
<div>{"inputs":["test"],"output":"TEST"}</div>
<div>{"inputs":["changed"],"output":"CHANGED"}</div>