
## Input

```javascript
// @compilationMode(infer)
import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function Component(props) {
  const x = useMemo(() => props.x(), [props.x]);
  return <ValidateMemoization inputs={[props.x]} output={x} />;
}

const f = () => ['React'];
const g = () => ['Compiler'];
export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: () => ['React']}],
  sequentialRenders: [{x: f}, {x: g}, {x: g}, {x: f}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @compilationMode(infer)
import { useMemo } from "react";
import { ValidateMemoization } from "shared-runtime";

function Component(props) {
  const $ = _c(7);
  let t0;
  let t1;
  if ($[0] !== props.x) {
    t1 = props.x();
    $[0] = props.x;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  const x = t0;
  let t2;
  if ($[2] !== props.x) {
    t2 = [props.x];
    $[2] = props.x;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t2 || $[5] !== x) {
    t3 = <ValidateMemoization inputs={t2} output={x} />;
    $[4] = t2;
    $[5] = x;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

const f = () => ["React"];
const g = () => ["Compiler"];
export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: () => ["React"] }],
  sequentialRenders: [{ x: f }, { x: g }, { x: g }, { x: f }],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":["[[ function params=0 ]]"],"output":["React"]}</div>
<div>{"inputs":["[[ function params=0 ]]"],"output":["Compiler"]}</div>
<div>{"inputs":["[[ function params=0 ]]"],"output":["Compiler"]}</div>
<div>{"inputs":["[[ function params=0 ]]"],"output":["React"]}</div>