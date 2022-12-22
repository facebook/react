
## Input

```javascript
function component() {
  let x = { t: 1 };
  let p = x.t;
}

```

## HIR

```
bb0:
  [1] Const mutate $4:TPrimitive = 1
  [2] Const mutate x$5_@0:TObject = Object { t: read $4:TPrimitive }
  [3] Const mutate p$6 = read x$5_@0.t
  [4] Return
```

## Reactive Scopes

```
function component(
) {
  [1] Const mutate $4:TPrimitive = 1
  scope @0 [2:3] deps=[] out=[x$5_@0] {
    [2] Const mutate x$5_@0:TObject = Object { t: read $4:TPrimitive }
  }
  [3] Const mutate p$6 = read x$5_@0.t
  return
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {
      t: 1,
    };
    $[0] = x;
  } else {
    x = $[0];
  }

  const p = x.t;
}

```
      