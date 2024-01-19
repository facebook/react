
## Input

```javascript
// @compilationMode(infer)

function Foo({}, ref) {
  return <div ref={ref} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @compilationMode(infer)

function Foo(t6, ref) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== ref) {
    t0 = <div ref={ref} />;
    $[0] = ref;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div></div>