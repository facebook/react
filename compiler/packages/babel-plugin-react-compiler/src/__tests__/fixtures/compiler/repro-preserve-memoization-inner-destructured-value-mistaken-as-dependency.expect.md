
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

/**
 * Repro from https://github.com/facebook/react/issues/34262
 *
 * We incorrectly infer `value` as the dependency, but that is a local value within the useMemo.
 */
function useInputValue(input) {
  const object = React.useMemo(() => {
    const {value} = transform(input);
    return {value};
  }, [input]);
  return object;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees

/**
 * Repro from https://github.com/facebook/react/issues/34262
 *
 * We incorrectly infer `value` as the dependency, but that is a local value within the useMemo.
 */
function useInputValue(input) {
  const $ = _c(4);
  let t0;
  if ($[0] !== input) {
    t0 = transform(input);
    $[0] = input;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const { value } = t0;
  let t1;
  if ($[2] !== value) {
    t1 = { value };
    $[2] = value;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const object = t1;
  return object;
}

```
      
### Eval output
(kind: exception) Fixture not implemented