
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import {useCallback, useRef} from 'react';

function Component() {
  const countRef = useRef(0);

  // Self-referencing callback with empty deps - recursiveIncrement references itself
  // This pattern is valid and should not trigger a memoization error
  const recursiveIncrement = useCallback(() => {
    countRef.current = countRef.current + 1;
    console.log('Count:', countRef.current);
    if (countRef.current < 10) {
      setTimeout(recursiveIncrement, 1000);
    }
  }, []);

  return (
    <div>
      <button onClick={recursiveIncrement}>Start counting</button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import { useCallback, useRef } from "react";

function Component() {
  const $ = _c(2);
  const countRef = useRef(0);
  let recursiveIncrement;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    recursiveIncrement = () => {
      countRef.current = countRef.current + 1;
      console.log("Count:", countRef.current);
      if (countRef.current < 10) {
        setTimeout(recursiveIncrement, 1000);
      }
    };
    $[0] = recursiveIncrement;
  } else {
    recursiveIncrement = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (
      <div>
        <button onClick={recursiveIncrement}>Start counting</button>
      </div>
    );
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) <div><button>Start counting</button></div>