
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * We currently hoist the accessed properties of function expressions,
 * regardless of control flow. This is simply because we wrote support for
 * function expressions before doing a lot of work in PropagateScopeDeps
 * to handle conditionally accessed dependencies.
 *
 * Current evaluator error:
 *  Found differences in evaluator results
 *  Non-forget (expected):
 *  (kind: ok) <div>{"shouldInvokeFns":true,"callback":{"kind":"Function","result":null}}</div>
 *  Forget:
 *  (kind: exception) Cannot read properties of null (reading 'prop')
 */
function Component({obj, isObjNull}) {
  const callback = () => {
    if (!isObjNull) {
      return obj.prop;
    } else {
      return null;
    }
  };
  return <Stringify shouldInvokeFns={true} callback={callback} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{obj: null, isObjNull: true}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * We currently hoist the accessed properties of function expressions,
 * regardless of control flow. This is simply because we wrote support for
 * function expressions before doing a lot of work in PropagateScopeDeps
 * to handle conditionally accessed dependencies.
 *
 * Current evaluator error:
 *  Found differences in evaluator results
 *  Non-forget (expected):
 *  (kind: ok) <div>{"shouldInvokeFns":true,"callback":{"kind":"Function","result":null}}</div>
 *  Forget:
 *  (kind: exception) Cannot read properties of null (reading 'prop')
 */
function Component(t0) {
  const $ = _c(5);
  const { obj, isObjNull } = t0;
  let t1;
  if ($[0] !== isObjNull || $[1] !== obj.prop) {
    t1 = () => {
      if (!isObjNull) {
        return obj.prop;
      } else {
        return null;
      }
    };
    $[0] = isObjNull;
    $[1] = obj.prop;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const callback = t1;
  let t2;
  if ($[3] !== callback) {
    t2 = <Stringify shouldInvokeFns={true} callback={callback} />;
    $[3] = callback;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ obj: null, isObjNull: true }],
};

```
      