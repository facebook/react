
## Input

```javascript
function foo() {
  const x = [];
  const y = { x: x };
  y.x.push([]);
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4_@0 = Array []
  [2] Const mutate y$5_@1:TObject[2:5] = Object { x: read x$4_@0 }
  [3] Const mutate $6_@1[2:5] = Array []
  [4] Call mutate y$5_@1.x.push(mutate $6_@1)
  [5] Return freeze y$5_@1:TObject
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:2] deps=[] out=[x$4_@0] {
    [1] Const mutate x$4_@0 = Array []
  }
  scope @1 [2:5] deps=[read x$4_@0] out=[y$5_@1] {
    [2] Const mutate y$5_@1:TObject[2:5] = Object { x: read x$4_@0 }
    [3] Const mutate $6_@1[2:5] = Array []
    [4] Call mutate y$5_@1.x.push(mutate $6_@1)
  }
  return freeze y$5_@1:TObject
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    $[0] = x;
  } else {
    x = $[0];
  }

  const c_1 = $[1] !== x;
  let y;

  if (c_1) {
    y = {
      x: x,
    };
    y.x.push([]);
    $[1] = x;
    $[2] = y;
  } else {
    y = $[2];
  }

  return y;
}

```
      