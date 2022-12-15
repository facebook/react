
## Input

```javascript
function component() {
  let z = [];
  let y = {};
  y.z = z;
  let x = {};
  x.y = y;
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate z$4_@0 = Array []
  [2] Const mutate y$5_@1:TObject[2:4] = Object {  }
  [3] Reassign mutate y$5_@1.z[2:4] = read z$4_@0
  [4] Const mutate x$6_@2:TObject[4:6] = Object {  }
  [5] Reassign mutate x$6_@2.y[4:6] = read y$5_@1:TObject
  [6] Return freeze x$6_@2:TObject
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] out=[z$4_@0] {
    [1] Const mutate z$4_@0 = Array []
  }
  scope @1 [2:4] deps=[read z$4_@0] out=[y$5_@1] {
    [2] Const mutate y$5_@1:TObject[2:4] = Object {  }
    [3] Reassign mutate y$5_@1.z[2:4] = read z$4_@0
  }
  scope @2 [4:6] deps=[read y$5_@1:TObject] out=[x$6_@2] {
    [4] Const mutate x$6_@2:TObject[4:6] = Object {  }
    [5] Reassign mutate x$6_@2.y[4:6] = read y$5_@1:TObject
  }
  return freeze x$6_@2:TObject
}

```

## Code

```javascript
function component$0() {
  const $ = React.useMemoCache();
  let z$4;
  if (true) {
    z$4 = [];
    $[0] = z$4;
  } else {
    z$4 = $[0];
  }

  const c_1 = $[1] !== z$4;
  let y$5;

  if (c_1) {
    y$5 = {};
    y$5.z = z$4;
    $[1] = z$4;
    $[2] = y$5;
  } else {
    y$5 = $[2];
  }

  const c_3 = $[3] !== y$5;
  let x$6;

  if (c_3) {
    x$6 = {};
    x$6.y = y$5;
    $[3] = y$5;
    $[4] = x$6;
  } else {
    x$6 = $[4];
  }

  return x$6;
}

```
      