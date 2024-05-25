
## Input

```javascript
import { useState } from "react";
import { Stringify } from "shared-runtime";

// This is a translation of the original merge-consecutive-scopes which uses plain objects
// to describe the UI instead of JSX. The JSXText elements in that fixture happen to
// prevent scome scopes from merging, which concealed a bug with the merging logic.
// By avoiding JSX we eliminate extraneous instructions and more accurately test the merging.
function Component(props) {
  let [state, setState] = useState(0);
  return [
    { component: Stringify, props: { text: "Counter" } },
    { component: "span", props: { children: [state] } },
    {
      component: "button",
      props: {
        "data-testid": "button",
        onClick: () => setState(state + 1),
        children: ["increment"],
      },
    },
  ];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";
import { Stringify } from "shared-runtime";

// This is a translation of the original merge-consecutive-scopes which uses plain objects
// to describe the UI instead of JSX. The JSXText elements in that fixture happen to
// prevent scome scopes from merging, which concealed a bug with the merging logic.
// By avoiding JSX we eliminate extraneous instructions and more accurately test the merging.
function Component(props) {
  const $ = _c(11);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] !== state) {
    t0 = () => setState(state + 1);
    $[0] = state;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = ["increment"];
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== t0) {
    t2 = {
      component: "button",
      props: { "data-testid": "button", onClick: t0, children: t1 },
    };
    $[3] = t0;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== state) {
    t3 = { component: "span", props: { children: [state] } };
    $[5] = state;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = { component: Stringify, props: { text: "Counter" } };
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== t3 || $[9] !== t2) {
    t5 = [t4, t3, t2];
    $[8] = t3;
    $[9] = t2;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  return t5;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) [{"component":"[[ function params=1 ]]","props":{"text":"Counter"}},{"component":"span","props":{"children":[0]}},{"component":"button","props":{"data-testid":"button","onClick":"[[ function params=0 ]]","children":["increment"]}}]