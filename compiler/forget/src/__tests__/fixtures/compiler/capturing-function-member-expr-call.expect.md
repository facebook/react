
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
function component(t27) {
  const $ = React.unstable_useMemoCache(4);
  const { mutator } = t27;
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
  return <Foo poke={poke} hide={hide}></Foo>;
}

```
      