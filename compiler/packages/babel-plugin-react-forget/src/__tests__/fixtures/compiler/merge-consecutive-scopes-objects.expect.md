
## Input

```javascript
// @enableMergeConsecutiveScopes
// This is a translation of the original merge-consecutive-scopes which uses plain objects
// to describe the UI instead of JSX. The JSXText elements in that fixture happen to
// prevent scome scopes from merging, which concealed a bug with the merging logic.
// By avoiding JSX we eliminate extraneous instructions and more accurately test the merging.
function Component(props) {
  let [state, setState] = useState(0);
  return [
    { component: Title, props: { text: "Counter" } },
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
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableMergeConsecutiveScopes
// This is a translation of the original merge-consecutive-scopes which uses plain objects
// to describe the UI instead of JSX. The JSXText elements in that fixture happen to
// prevent scome scopes from merging, which concealed a bug with the merging logic.
// By avoiding JSX we eliminate extraneous instructions and more accurately test the merging.
function Component(props) {
  const $ = useMemoCache(11);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { component: Title, props: { text: "Counter" } };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const c_1 = $[1] !== state;
  let t1;
  if (c_1) {
    t1 = { component: "span", props: { children: [state] } };
    $[1] = state;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const c_3 = $[3] !== state;
  let t2;
  if (c_3) {
    t2 = () => setState(state + 1);
    $[3] = state;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = ["increment"];
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const c_6 = $[6] !== t2;
  let t4;
  if (c_6) {
    t4 = {
      component: "button",
      props: { "data-testid": "button", onClick: t2, children: t3 },
    };
    $[6] = t2;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  const c_8 = $[8] !== t1;
  const c_9 = $[9] !== t4;
  let t5;
  if (c_8 || c_9) {
    t5 = [t0, t1, t4];
    $[8] = t1;
    $[9] = t4;
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
      