
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
function component$0() {
  const $ = React.useMemoCache();
  let p$7;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    p$7 = makePrimitive$1();
    $[0] = p$7;
  } else {
    p$7 = $[0];
  }

  p$7 + p$7;
  let o$8;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    o$8 = {};
    $[1] = o$8;
  } else {
    o$8 = $[1];
  }

  const c_2 = $[2] !== p$7;
  const c_3 = $[3] !== o$8;
  let x$9;

  if (c_2 || c_3) {
    x$9 = {};
    x$9.t = p$7;
    const z$10 = x$9.t;
    x$9.t = o$8;
    $[2] = p$7;
    $[3] = o$8;
    $[4] = x$9;
  } else {
    x$9 = $[4];
  }

  const y$11 = x$9.t;
}

```
      