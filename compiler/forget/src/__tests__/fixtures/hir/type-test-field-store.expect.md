
## Input

```javascript
function component() {
  let x = {};
  let q = {};
  x.t = q;
  let z = x.t;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4_@0:TObject[1:4] = Object {  }
  [2] Const mutate q$5_@1:TObject = Object {  }
  [3] Reassign mutate x$4_@0.t[1:4] = read q$5_@1:TObject
  [4] Const mutate z$6:TObject = read x$4_@0.t
  [5] Return
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:4] deps=[] out=[x$4_@0] {
    [1] Const mutate x$4_@0:TObject[1:4] = Object {  }
    scope @1 [2:3] deps=[] out=[q$5_@1] {
      [2] Const mutate q$5_@1:TObject = Object {  }
    }
    [3] Reassign mutate x$4_@0.t[1:4] = read q$5_@1:TObject
  }
  [4] Const mutate z$6:TObject = read x$4_@0.t
  return
}

```

## Code

```javascript
function component$0() {
  const $ = React.useMemoCache();
  let x$4;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$4 = {};
    let q$5;

    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      q$5 = {};
      $[1] = q$5;
    } else {
      q$5 = $[1];
    }

    x$4.t = q$5;
    $[0] = x$4;
  } else {
    x$4 = $[0];
  }

  const z$6 = x$4.t;
}

```
      