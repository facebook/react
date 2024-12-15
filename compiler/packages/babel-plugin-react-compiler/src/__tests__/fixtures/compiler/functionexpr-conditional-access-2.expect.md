
## Input

```javascript
// @enableTreatFunctionDepsAsConditional
import {Stringify} from 'shared-runtime';

function Component({props}) {
  const f = () => props.a.b;

  return <Stringify f={props == null ? () => {} : f} />;
}
export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{props: null}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableTreatFunctionDepsAsConditional
import { Stringify } from "shared-runtime";

function Component(t0) {
  const $ = _c(7);
  const { props } = t0;
  let t1;
  if ($[0] !== props) {
    t1 = () => props.a.b;
    $[0] = props;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const f = t1;
  let t2;
  if ($[2] !== f || $[3] !== props) {
    t2 = props == null ? _temp : f;
    $[2] = f;
    $[3] = props;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== t2) {
    t3 = <Stringify f={t2} />;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}
function _temp() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ props: null }],
};

```
      
### Eval output
(kind: ok) <div>{"f":"[[ function params=0 ]]"}</div>