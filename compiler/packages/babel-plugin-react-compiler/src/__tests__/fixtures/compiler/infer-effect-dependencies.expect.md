
## Input

```javascript
// @inferEffectDependencies
const nonreactive = 0;

function Component({foo, bar}) {
  useEffect(() => {
    console.log(foo);
    console.log(bar);
    console.log(nonreactive);
  });
  
  useEffect(() => {
    console.log(foo);
    console.log(bar?.baz);
    console.log(bar.qux);
  });
  
  function f() {
    console.log(foo);
  }
  
  useEffect(f);
  
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
const nonreactive = 0;

function Component(t0) {
  const $ = _c(8);
  const { foo, bar } = t0;
  let t1;
  if ($[0] !== foo || $[1] !== bar) {
    t1 = () => {
      console.log(foo);
      console.log(bar);
      console.log(nonreactive);
    };
    $[0] = foo;
    $[1] = bar;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  useEffect(t1, [foo, bar]);
  let t2;
  if ($[3] !== foo || $[4] !== bar) {
    t2 = () => {
      console.log(foo);
      console.log(bar?.baz);
      console.log(bar.qux);
    };
    $[3] = foo;
    $[4] = bar;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  useEffect(t2, [foo, bar, bar.qux]);
  let t3;
  if ($[6] !== foo) {
    t3 = function f() {
      console.log(foo);
    };
    $[6] = foo;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const f = t3;

  useEffect(f);
}

```
      
### Eval output
(kind: exception) Fixture not implemented