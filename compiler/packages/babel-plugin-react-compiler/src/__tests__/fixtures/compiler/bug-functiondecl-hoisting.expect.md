
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Fixture currently fails with
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) <div>{"result":{"value":2},"fn":{"kind":"Function","result":{"value":2}},"shouldInvokeFns":true}</div>
 *   Forget:
 *   (kind: exception) bar is not a function
 */
function Foo({value}) {
  const result = bar();
  function bar() {
    return {value};
  }
  return <Stringify result={result} fn={bar} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{value: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Fixture currently fails with
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) <div>{"result":{"value":2},"fn":{"kind":"Function","result":{"value":2}},"shouldInvokeFns":true}</div>
 *   Forget:
 *   (kind: exception) bar is not a function
 */
function Foo(t0) {
  const $ = _c(6);
  const { value } = t0;
  let bar;
  let result;
  if ($[0] !== value) {
    result = bar();
    bar = function bar() {
      return { value };
    };
    $[0] = value;
    $[1] = bar;
    $[2] = result;
  } else {
    bar = $[1];
    result = $[2];
  }
  let t1;
  if ($[3] !== bar || $[4] !== result) {
    t1 = <Stringify result={result} fn={bar} shouldInvokeFns={true} />;
    $[3] = bar;
    $[4] = result;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ value: 2 }],
};

```
      