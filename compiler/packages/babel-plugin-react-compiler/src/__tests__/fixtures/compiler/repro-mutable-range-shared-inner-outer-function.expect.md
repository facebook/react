
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
let cond = true;
function Component(props) {
  let a;
  let b;
  const f = () => {
    if (cond) {
      a = {};
      b = [];
    } else {
      a = {};
      b = [];
    }
    a.property = true;
    b.push(false);
  };
  return <div onClick={f()} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
let cond = true;
function Component(props) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let a;
    let b;
    const f = () => {
      if (cond) {
        a = {};
        b = [];
      } else {
        a = {};
        b = [];
      }

      a.property = true;
      b.push(false);
    };

    t0 = <div onClick={f()} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div></div>