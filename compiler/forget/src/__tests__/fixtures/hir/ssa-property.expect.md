
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate x$3_@0 = Array []
  [2] Const mutate y$4_@1:TObject[2:4] = Object {  }
  [3] Reassign store y$4_@1.x[2:4] = read x$3_@0
  [4] Return freeze y$4_@1:TObject
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:2] deps=[] out=[x$3_@0] {
    [1] Const mutate x$3_@0 = Array []
  }
  scope @1 [2:4] deps=[read x$3_@0] out=[y$4_@1] {
    [2] Const mutate y$4_@1:TObject[2:4] = Object {  }
    [3] Reassign store y$4_@1.x[2:4] = read x$3_@0
  }
  return freeze y$4_@1:TObject
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
    y = {};
    y.x = x;
    $[1] = x;
    $[2] = y;
  } else {
    y = $[2];
  }

  return y;
}

```
      