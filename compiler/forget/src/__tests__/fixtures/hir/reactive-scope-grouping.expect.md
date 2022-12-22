
## Input

```javascript
function foo() {
  let x = {};
  let y = [];
  let z = {};
  y.push(z);
  x.y = y;

  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4_@0:TObject[1:6] = Object {  }
  [2] Const mutate y$5_@1[2:5] = Array []
  [3] Const mutate z$6_@1:TObject[2:5] = Object {  }
  [4] Call mutate y$5_@1.push(mutate z$6_@1:TObject)
  [5] Reassign store x$4_@0.y[1:6] = read y$5_@1
  [6] Return freeze x$4_@0:TObject
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:6] deps=[] out=[x$4_@0] {
    [1] Const mutate x$4_@0:TObject[1:6] = Object {  }
    scope @1 [2:5] deps=[] out=[y$5_@1] {
      [2] Const mutate y$5_@1[2:5] = Array []
      [3] Const mutate z$6_@1:TObject[2:5] = Object {  }
      [4] Call mutate y$5_@1.push(mutate z$6_@1:TObject)
    }
    [5] Reassign store x$4_@0.y[1:6] = read y$5_@1
  }
  return freeze x$4_@0:TObject
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    let y;

    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      y = [];
      const z = {};
      y.push(z);
      $[1] = y;
    } else {
      y = $[1];
    }

    x.y = y;
    $[0] = x;
  } else {
    x = $[0];
  }

  return x;
}

```
      