
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
  const $ = useMemoCache(18);
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
    const t2 = [state];
    t1 = { children: t2 };
    $[1] = state;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const c_3 = $[3] !== t2;
  if (c_3) {
    t1 = { children: t2 };
    $[3] = t2;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const c_5 = $[5] !== t1;
  let t3;
  if (c_5) {
    t3 = { component: "span", props: t1 };
    $[5] = t1;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const c_7 = $[7] !== state;
  let t4;
  if (c_7) {
    t4 = () => setState(state + 1);
    $[7] = state;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  let t5;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = ["increment"];
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = ["increment"];
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const c_11 = $[11] !== t4;
  let t6;
  if (c_11) {
    const t7 = { "data-testid": "button", onClick: t4, children: t5 };
    t6 = { component: "button", props: t7 };
    $[11] = t4;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  const c_13 = $[13] !== t7;
  if (c_13) {
    t6 = { component: "button", props: t7 };
    $[13] = t7;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  const c_15 = $[15] !== t3;
  const c_16 = $[16] !== t6;
  let t8;
  if (c_15 || c_16) {
    t8 = [t0, t3, t6];
    $[15] = t3;
    $[16] = t6;
    $[17] = t8;
  } else {
    t8 = $[17];
  }
  return t8;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      