
## Input

```javascript
// @inferEffectDependencies
const moduleNonReactive = 0;

function Component({foo, bar}) {
  const localNonreactive = 0;
  const ref = useRef(0);
  const localNonPrimitiveReactive = {
    foo,
  };
  const localNonPrimitiveNonreactive = {};
  useEffect(() => {
    console.log(foo);
    console.log(bar);
    console.log(moduleNonReactive);
    console.log(localNonreactive);
    console.log(globalValue);
    console.log(ref.current);
    console.log(localNonPrimitiveReactive);
    console.log(localNonPrimitiveNonreactive);
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
  const $ = _c(12);
  const { foo, bar } = t0;

  const ref = useRef(0);
  let t1;
  if ($[0] !== foo) {
    t1 = { foo };
    $[0] = foo;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const localNonPrimitiveReactive = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = {};
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const localNonPrimitiveNonreactive = t2;
  let t3;
  if ($[3] !== bar || $[4] !== foo || $[5] !== localNonPrimitiveReactive) {
    t3 = () => {
      console.log(foo);
      console.log(bar);
      console.log(moduleNonReactive);
      console.log(0);
      console.log(globalValue);
      console.log(ref.current);
      console.log(localNonPrimitiveReactive);
      console.log(localNonPrimitiveNonreactive);
    };
    $[3] = bar;
    $[4] = foo;
    $[5] = localNonPrimitiveReactive;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  useEffect(t3, [
    foo,
    bar,
    ref,
    localNonPrimitiveReactive,
    localNonPrimitiveNonreactive,
  ]);
  let t4;
  if ($[7] !== bar.baz || $[8] !== bar.qux) {
    t4 = () => {
      console.log(bar?.baz);
      console.log(bar.qux);
    };
    $[7] = bar.baz;
    $[8] = bar.qux;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  useEffect(t4, [bar.baz, bar.qux]);
  let t5;
  if ($[10] !== foo) {
    t5 = function f() {
      console.log(foo);
    };
    $[10] = foo;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  const f = t5;

  useEffect(f);
}

```
      
### Eval output
(kind: exception) Fixture not implemented