
## Input

```javascript
function Component(props) {
  const x = makeOptionalFunction(props);
  // for a regular call, the JSX element could be independently memoized
  // since it is an immutable value. however, because the call is optional,
  // we can't extract out independent memoization for the element w/o
  // forcing that argument to evaluate unconditionally
  const y = x?.(
    <div>
      <span>{props.text}</span>
    </div>
  );
  return y;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    const x = makeOptionalFunction(props);

    t0 = x?.(
      <div>
        <span>{props.text}</span>
      </div>
    );
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  return y;
}

```
      