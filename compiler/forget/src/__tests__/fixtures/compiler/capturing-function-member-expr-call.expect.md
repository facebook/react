
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
function component(t29) {
  const $ = React.unstable_useMemoCache(7);
  const { mutator } = t29;
  const c_0 = $[0] !== mutator;
  let t0;
  if (c_0) {
    t0 = () => {
      mutator.poke();
    };
    $[0] = mutator;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const poke = t0;
  const c_2 = $[2] !== mutator.user;
  let t1;
  if (c_2) {
    t1 = () => {
      mutator.user.hide();
    };
    $[2] = mutator.user;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const hide = t1;
  const c_4 = $[4] !== poke;
  const c_5 = $[5] !== hide;
  let t2;
  if (c_4 || c_5) {
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
      