
## Input

```javascript
// @inferEffectDependencies
const moduleNonReactive = 0;

function Component({foo, bar}) {
  const localNonreactive = 0;
  useEffect(() => {
    console.log(foo);
    console.log(bar);
    console.log(moduleNonReactive);
    console.log(localNonreactive);
    console.log(globalValue);
  });

  // Optional chains and property accesses
  // TODO: we may be able to save bytes by omitting property accesses if the
  // object of the member expression is already included in the inferred deps
  useEffect(() => {
    console.log(bar?.baz);
    console.log(bar.qux);
  });

  function f() {
    console.log(foo);
  }

  // No inferred dep array, the argument is not a lambda
  useEffect(f);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
const moduleNonReactive = 0;

function Component(t0) {
  const $ = _c(7);
  const { foo, bar } = t0;
  let t1;
  if ($[0] !== foo || $[1] !== bar) {
    t1 = () => {
      console.log(foo);
      console.log(bar);
      console.log(moduleNonReactive);
      console.log(0);
      console.log(globalValue);
    };
    $[0] = foo;
    $[1] = bar;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  useEffect(t1, [foo, bar]);
  let t2;
  if ($[3] !== bar) {
    t2 = () => {
      console.log(bar?.baz);
      console.log(bar.qux);
    };
    $[3] = bar;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t2, [bar, bar.qux]);
  let t3;
  if ($[5] !== foo) {
    t3 = function f() {
      console.log(foo);
    };
    $[5] = foo;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const f = t3;

  useEffect(f);
}

```
      
### Eval output
(kind: exception) Fixture not implemented