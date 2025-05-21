
## Input

```javascript
// @enableFire @inferEffectDependencies
import {fire, useEffect} from 'react';

function Component(props) {
  const foo = arg => {
    console.log(arg, props.bar);
  };
  useEffect(() => {
    fire(foo(props));
  });

  return null;
}

```

## Code

```javascript
import { c as _c, useFire } from "react/compiler-runtime"; // @enableFire @inferEffectDependencies
import { fire, useEffect } from "react";

function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props.bar) {
    t0 = (arg) => {
      console.log(arg, props.bar);
    };
    $[0] = props.bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const foo = t0;
  const t1 = useFire(foo);
  let t2;
  if ($[2] !== props || $[3] !== t1) {
    t2 = () => {
      t1(props);
    };
    $[2] = props;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t2, [props]);
  return null;
}

```
      
### Eval output
(kind: exception) Fixture not implemented