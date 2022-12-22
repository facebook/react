
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
  [3] Reassign store y$5_@1.z[2:4] = read z$4_@0
  [4] Const mutate x$6_@2:TObject[4:6] = Object {  }
  [5] Reassign store x$6_@2.y[4:6] = read y$5_@1:TObject
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
    [3] Reassign store y$5_@1.z[2:4] = read z$4_@0
  }
  scope @2 [4:6] deps=[read y$5_@1:TObject] out=[x$6_@2] {
    [4] Const mutate x$6_@2:TObject[4:6] = Object {  }
    [5] Reassign store x$6_@2.y[4:6] = read y$5_@1:TObject
  }
  return freeze x$6_@2:TObject
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let z;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    z = [];
    $[0] = z;
  } else {
    z = $[0];
  }

  const c_1 = $[1] !== z;
  let y;

  if (c_1) {
    y = {};
    y.z = z;
    $[1] = z;
    $[2] = y;
  } else {
    y = $[2];
  }

  const c_3 = $[3] !== y;
  let x;

  if (c_3) {
    x = {};
    x.y = y;
    $[3] = y;
    $[4] = x;
  } else {
    x = $[4];
  }

  return x;
}

```
      