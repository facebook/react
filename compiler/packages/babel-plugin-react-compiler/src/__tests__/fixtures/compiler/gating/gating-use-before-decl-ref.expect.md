
## Input

```javascript
// @gating
import {createRef, forwardRef} from 'react';
import {Stringify} from 'shared-runtime';

const Foo = forwardRef(Foo_withRef);
function Foo_withRef(props, ref) {
  return <Stringify ref={ref} {...props} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: eval('(...args) => React.createElement(Foo, args)'),
  params: [{prop1: 1, prop2: 2, ref: createRef()}],
};

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { c as _c } from "react/compiler-runtime"; // @gating
import { createRef, forwardRef } from "react";
import { Stringify } from "shared-runtime";

const Foo = forwardRef(Foo_withRef);
const _isForgetEnabled_Fixtures_result = isForgetEnabled_Fixtures();
function _Foo_withRef_optimized(props, ref) {
  const $ = _c(3);
  let t0;
  if ($[0] !== props || $[1] !== ref) {
    t0 = <Stringify ref={ref} {...props} />;
    $[0] = props;
    $[1] = ref;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}
function _Foo_withRef_unoptimized(props, ref) {
  return <Stringify ref={ref} {...props} />;
}
function Foo_withRef(arg0, arg1) {
  if (_isForgetEnabled_Fixtures_result)
    return _Foo_withRef_optimized(arg0, arg1);
  else return _Foo_withRef_unoptimized(arg0, arg1);
}

export const FIXTURE_ENTRYPOINT = {
  fn: eval("(...args) => React.createElement(Foo, args)"),
  params: [{ prop1: 1, prop2: 2, ref: createRef() }],
};

```
      
### Eval output
(kind: ok) <div>{"0":{"prop1":1,"prop2":2,"ref":{"current":null}},"ref":"[[ cyclic ref *3 ]]"}</div>