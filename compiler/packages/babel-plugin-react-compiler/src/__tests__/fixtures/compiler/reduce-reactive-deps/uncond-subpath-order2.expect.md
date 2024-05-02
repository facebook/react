
## Input

```javascript
// Determine that we only need to track p.a here
// Ordering of access should not matter
function TestDepsSubpathOrder2(props) {
  let x = {};
  x.a = props.a;
  x.b = props.a.b;
  x.c = props.a.b.c;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: TestDepsSubpathOrder2,
  params: [{ a: { b: { c: 2 } } }],
};

```

## Code

```javascript
import { c as useMemoCache } from "react"; // Determine that we only need to track p.a here
// Ordering of access should not matter
function TestDepsSubpathOrder2(props) {
  const $ = useMemoCache(2);
  let x;
  if ($[0] !== props.a) {
    x = {};
    x.a = props.a;
    x.b = props.a.b;
    x.c = props.a.b.c;
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: TestDepsSubpathOrder2,
  params: [{ a: { b: { c: 2 } } }],
};

```
      
### Eval output
(kind: ok) {"a":{"b":{"c":2}},"b":"[[ cyclic ref *2 ]]","c":2}