
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(t0) {
  const $ = useMemoCache(11);
  const { label, highlightedItem } = t0;
  const serverTime = useServerTime();
  let t1;
  let timestampLabel;
  if ($[0] !== highlightedItem || $[1] !== serverTime || $[2] !== label) {
    const highlight = new Highlight(highlightedItem);

    const time = serverTime.get();
    let t2;
    if ($[5] !== time || $[6] !== label) {
      t2 = time / 1000 || label;
      $[5] = time;
      $[6] = label;
      $[7] = t2;
    } else {
      t2 = $[7];
    }
    timestampLabel = t2;

    t1 = highlight.render();
    $[0] = highlightedItem;
    $[1] = serverTime;
    $[2] = label;
    $[3] = t1;
    $[4] = timestampLabel;
  } else {
    t1 = $[3];
    timestampLabel = $[4];
  }
  let t2;
  if ($[8] !== t1 || $[9] !== timestampLabel) {
    t2 = (
      <>
        {t1}
        {timestampLabel}
      </>
    );
    $[8] = t1;
    $[9] = timestampLabel;
    $[10] = t2;
  } else {
    t2 = $[10];
  }
  return t2;
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