
## Input

```javascript
import {useEffect, useState} from 'react';
import {Stringify} from 'shared-runtime';

function Foo() {
  /**
   * Previously, this lowered to
   * $1 = LoadContext capture setState
   * $2 = FunctionExpression deps=$1 context=setState
   *  [[ at this point, we freeze the `LoadContext setState` instruction, but it will never be referenced again ]]
   *
   * Now, this function expression directly references `setState`, which freezes
   * the source `DeclareContext HoistedConst setState`. Freezing source identifiers
   * (instead of the one level removed `LoadContext`) is more semantically correct
   * for everything *other* than hoisted context declarations.
   *
   * $2 = Function context=setState
   */
  useEffect(() => setState(2), []);

  const [state, setState] = useState(0);
  return <Stringify state={state} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from "react";
import { Stringify } from "shared-runtime";

function Foo() {
  const $ = _c(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useEffect(() => setState(2), t0);

  const [state, t1] = useState(0);
  const setState = t1;
  let t2;
  if ($[1] !== state) {
    t2 = <Stringify state={state} />;
    $[1] = state;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```
      
### Eval output
(kind: ok) <div>{"state":2}</div>
<div>{"state":2}</div>