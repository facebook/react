
## Input

```javascript
// @flow @enableAssumeHooksFollowRulesOfReact
function Component({label, highlightedItem}) {
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
  'use no forget';

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
  params: [{label: '<unused>', highlightedItem: 'Seconds passed: '}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(t0) {
  const $ = _c(12);
  const { label, highlightedItem } = t0;
  const serverTime = useServerTime();
  let t1;
  if ($[0] !== highlightedItem) {
    t1 = new Highlight(highlightedItem);
    $[0] = highlightedItem;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  let timestampLabel;
  if ($[2] !== label || $[3] !== serverTime || $[4] !== t1) {
    const highlight = t1;
    const time = serverTime.get();
    timestampLabel = time / 1000 || label;
    if ($[7] !== highlight) {
      t2 = highlight.render();
      $[7] = highlight;
      $[8] = t2;
    } else {
      t2 = $[8];
    }
    $[2] = label;
    $[3] = serverTime;
    $[4] = t1;
    $[5] = t2;
    $[6] = timestampLabel;
  } else {
    t2 = $[5];
    timestampLabel = $[6];
  }
  let t3;
  if ($[9] !== t2 || $[10] !== timestampLabel) {
    t3 = (
      <>
        {t2}
        {timestampLabel}
      </>
    );
    $[9] = t2;
    $[10] = timestampLabel;
    $[11] = t3;
  } else {
    t3 = $[11];
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