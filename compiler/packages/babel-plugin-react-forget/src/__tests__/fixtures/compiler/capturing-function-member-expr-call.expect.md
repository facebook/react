
## Input

```javascript
function component({ mutator }) {
  const poke = () => {
    mutator.poke();
  };

  const hide = () => {
    mutator.user.hide();
  };

  return <Foo poke={poke} hide={hide}></Foo>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(t26) {
  const $ = useMemoCache(7);
  const { mutator } = t26;
  let t0;
  if ($[0] !== mutator) {
    t0 = () => {
      mutator.poke();
    };
    $[0] = mutator;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const poke = t0;
  let t1;
  if ($[2] !== mutator.user) {
    t1 = () => {
      mutator.user.hide();
    };
    $[2] = mutator.user;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const hide = t1;
  let t2;
  if ($[4] !== poke || $[5] !== hide) {
    t2 = <Foo poke={poke} hide={hide} />;
    $[4] = poke;
    $[5] = hide;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      