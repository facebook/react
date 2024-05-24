
## Input

```javascript
// @flow @enableAssumeHooksFollowRulesOfReact
function Component({ label, highlightedItem }) {
  const serverTime = useServerTime();
  const highlight = new Highlight(highlightedItem);

  const time = serverTime.get();
  // subtle bit here: the binary expression infers the result of the call
  // as a primitive and not needing memoization. the logical is necessary
  // because without it there are no intermediate scopes which observe
  // the result of the binary expression, so its memoization can be pruned
  const timestampLabel = time / 1000 || label;

  return (
    <>
      {highlight.render()}
      {timestampLabel}
    </>
  );
}

function useServerTime() {
  "use no forget";

  return {
    get() {
      return 42000; // would be a constant value from the server
    },
  };
}

class Highlight {
  constructor(value) {
    this.value = value;
  }

  render() {
    return this.value;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ label: "<unused>", highlightedItem: "Seconds passed: " }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(t0) {
  const $ = _c(8);
  const serverTime = useServerTime();

  const time = serverTime.get();
  const { label, highlightedItem } = t0;
  let t1;
  let t2;
  if ($[0] !== highlightedItem || $[1] !== time || $[2] !== label) {
    const highlight = new Highlight(highlightedItem);

    t1 = time / 1000 || label;

    t2 = highlight.render();
    $[0] = highlightedItem;
    $[1] = time;
    $[2] = label;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  const timestampLabel = t1;
  let t3;
  if ($[5] !== t2 || $[6] !== timestampLabel) {
    t3 = (
      <>
        {t2}
        {timestampLabel}
      </>
    );
    $[5] = t2;
    $[6] = timestampLabel;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
}

function useServerTime() {
  "use no forget";

  return {
    get() {
      return 42000;
    },
  };
}

class Highlight {
  constructor(value) {
    this.value = value;
  }

  render() {
    return this.value;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ label: "<unused>", highlightedItem: "Seconds passed: " }],
};

```
      
### Eval output
(kind: ok) Seconds passed: 42