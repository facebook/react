
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  mutate(x);
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4_@0[1:5] = Array []
  [2] Const mutate y$5_@0:TObject[1:5] = Object {  }
  [3] Reassign store y$5_@0.x[1:5] = read x$4_@0
  [4] Call mutate mutate$3:TFunction(mutate x$4_@0)
  [5] Return freeze y$5_@0:TObject
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:5] deps=[] out=[y$5_@0] {
    [1] Const mutate x$4_@0[1:5] = Array []
    [2] Const mutate y$5_@0:TObject[1:5] = Object {  }
    [3] Reassign store y$5_@0.x[1:5] = read x$4_@0
    [4] Call mutate mutate$3:TFunction(mutate x$4_@0)
  }
  return freeze y$5_@0:TObject
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = [];
    y = {};
    y.x = x;
    mutate(x);
    $[0] = y;
  } else {
    y = $[0];
  }

  return y;
}

```
      