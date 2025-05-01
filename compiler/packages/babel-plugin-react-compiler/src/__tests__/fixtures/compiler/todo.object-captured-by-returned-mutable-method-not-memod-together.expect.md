
## Input

```javascript
// @flow
/**
 * Creates a map function that lazily caches the results for future invocations.
 */
hook useMemoMap<TInput: interface {}, TOutput>(
  map: TInput => TOutput
): TInput => TOutput {
  return useMemo(() => {
    const cache = new WeakMap<TInput, TOutput>();
    return input => {
      let output = cache.get(input);
      if (output == null) {
        output = map(input);
        cache.set(input, output);
      }
      return output;
    };
  }, [map]);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";

function useMemoMap(map) {
  const $ = _c(2);
  let t0;
  let t1;
  if ($[0] !== map) {
    const cache = new WeakMap();
    t1 = (input) => {
      let output = cache.get(input);
      if (output == null) {
        output = map(input);
        cache.set(input, output);
      }
      return output;
    };
    $[0] = map;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented