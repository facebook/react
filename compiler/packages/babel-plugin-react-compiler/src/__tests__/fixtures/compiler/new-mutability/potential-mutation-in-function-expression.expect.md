
## Input

```javascript
// @enableNewMutationAliasingModel
function Component({a, b, c}) {
  const x = [a, b];
  const f = () => {
    maybeMutate(x);
    // different dependency to force this not to merge with x's scope
    console.log(c);
  };
  return <Foo onClick={f} value={x} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNewMutationAliasingModel
function Component(t0) {
  const $ = _c(8);
  const { a, b, c } = t0;
  let t1;
  let x;
  if ($[0] !== a || $[1] !== b || $[2] !== c) {
    x = [a, b];
    t1 = () => {
      maybeMutate(x);

      console.log(c);
    };
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = t1;
    $[4] = x;
  } else {
    t1 = $[3];
    x = $[4];
  }
  const f = t1;
  let t2;
  if ($[5] !== f || $[6] !== x) {
    t2 = <Foo onClick={f} value={x} />;
    $[5] = f;
    $[6] = x;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented