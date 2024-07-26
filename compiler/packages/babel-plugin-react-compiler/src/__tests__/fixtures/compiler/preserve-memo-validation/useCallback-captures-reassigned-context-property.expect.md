
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';
import {Stringify} from 'shared-runtime';

function Foo(props) {
  let contextVar;
  if (props.cond) {
    contextVar = {val: 2};
  } else {
    contextVar = {};
  }

  const cb = useCallback(() => [contextVar.val], [contextVar.val]);

  return <Stringify cb={cb} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{cond: true}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useCallback } from "react";
import { Stringify } from "shared-runtime";

function Foo(props) {
  const $ = _c(6);
  let contextVar;
  if ($[0] !== props.cond) {
    if (props.cond) {
      contextVar = { val: 2 };
    } else {
      contextVar = {};
    }
    $[0] = props.cond;
    $[1] = contextVar;
  } else {
    contextVar = $[1];
  }

  const t0 = contextVar;
  let t1;
  if ($[2] !== t0.val) {
    t1 = () => [contextVar.val];
    $[2] = t0.val;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  contextVar;
  const cb = t1;
  let t2;
  if ($[4] !== cb) {
    t2 = <Stringify cb={cb} shouldInvokeFns={true} />;
    $[4] = cb;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ cond: true }],
};

```
      
### Eval output
(kind: ok) <div>{"cb":{"kind":"Function","result":[2]},"shouldInvokeFns":true}</div>