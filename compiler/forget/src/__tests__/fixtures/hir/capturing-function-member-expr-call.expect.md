
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
function component(t23) {
  const $ = React.unstable_useMemoCache(7);
  const t0 = t23;
  const mutator = t0.mutator;
  const c_0 = $[0] !== mutator;
  let poke;
  if (c_0) {
    poke = () => {
      mutator.poke();
    };
    $[0] = mutator;
    $[1] = poke;
  } else {
    poke = $[1];
  }
  const c_2 = $[2] !== t0.mutator.user;
  let hide;
  if (c_2) {
    hide = () => {
      mutator.user.hide();
    };
    $[2] = t0.mutator.user;
    $[3] = hide;
  } else {
    hide = $[3];
  }
  const c_4 = $[4] !== poke;
  const c_5 = $[5] !== hide;
  let t1;
  if (c_4 || c_5) {
    t1 = <Foo poke={poke} hide={hide}></Foo>;
    $[4] = poke;
    $[5] = hide;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

```
      