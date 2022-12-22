
## Input

```javascript
function component() {
  let p = makePrimitive();
  p + p; // infer p as primitive
  let o = {};

  let x = {};

  x.t = p; // infer x.t as primitive
  let z = x.t;

  x.t = o; // generalize x.t
  let y = x.t;
}

```

## HIR

```
bb0:
  [1] Const mutate p$7_@0:TPrimitive = Call mutate makePrimitive$1:TFunction()
  [2] Binary read p$7_@0:TPrimitive + read p$7_@0:TPrimitive
  [3] Const mutate o$8_@1:TObject = Object {  }
  [4] Const mutate x$9_@2:TObject[4:8] = Object {  }
  [5] Reassign store x$9_@2.t[4:8] = read p$7_@0:TPrimitive
  [6] Const mutate z$10_@2[4:8] = read x$9_@2.t
  [7] Reassign store x$9_@2.t[4:8] = read o$8_@1:TObject
  [8] Const mutate y$11 = read x$9_@2.t
  [9] Return
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] out=[p$7_@0] {
    [1] Const mutate p$7_@0:TPrimitive = Call mutate makePrimitive$1:TFunction()
  }
  [2] Binary read p$7_@0:TPrimitive + read p$7_@0:TPrimitive
  scope @1 [3:4] deps=[] out=[o$8_@1] {
    [3] Const mutate o$8_@1:TObject = Object {  }
  }
  scope @2 [4:8] deps=[read p$7_@0:TPrimitive, read o$8_@1:TObject] out=[x$9_@2] {
    [4] Const mutate x$9_@2:TObject[4:8] = Object {  }
    [5] Reassign store x$9_@2.t[4:8] = read p$7_@0:TPrimitive
    [6] Const mutate z$10_@2[4:8] = read x$9_@2.t
    [7] Reassign store x$9_@2.t[4:8] = read o$8_@1:TObject
  }
  [8] Const mutate y$11 = read x$9_@2.t
  return
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let p;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    p = makePrimitive();
    $[0] = p;
  } else {
    p = $[0];
  }

  p + p;
  let o;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    o = {};
    $[1] = o;
  } else {
    o = $[1];
  }

  const c_2 = $[2] !== p;
  const c_3 = $[3] !== o;
  let x;

  if (c_2 || c_3) {
    x = {};
    x.t = p;
    const z = x.t;
    x.t = o;
    $[2] = p;
    $[3] = o;
    $[4] = x;
  } else {
    x = $[4];
  }

  const y = x.t;
}

```
      