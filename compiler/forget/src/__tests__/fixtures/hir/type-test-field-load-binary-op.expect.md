
## Input

```javascript
function component() {
  let x = { u: makeSomePrimitive(), v: makeSomePrimitive() };
  let u = x.u;
  let v = x.v;
  if (u > v) {
  }

  let y = x.u;
  let z = x.v;
}

```

## HIR

```
bb0:
  [1] Const mutate t0$10_@0:TPrimitive = Call mutate makeSomePrimitive$2:TFunction()
  [2] Const mutate t1$11_@1:TPrimitive = Call mutate makeSomePrimitive$2:TFunction()
  [3] Const mutate x$12_@2:TObject = Object { u: read t0$10_@0:TPrimitive, v: read t1$11_@1:TPrimitive }
  [4] Const mutate u$13:TPrimitive = read x$12_@2.u
  [5] Const mutate v$14:TPrimitive = read x$12_@2.v
  [6] Const mutate $15:TPrimitive = Binary read u$13:TPrimitive > read v$14:TPrimitive
  [7] If (read $15:TPrimitive) then:bb1 else:bb1 fallthrough=bb1
bb1:
  predecessor blocks: bb0
  [8] Const mutate y$16:TPrimitive = read x$12_@2.u
  [9] Const mutate z$17:TPrimitive = read x$12_@2.v
  [10] Return
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] out=[$10_@0] {
    [1] Const mutate $10_@0:TPrimitive = Call mutate makeSomePrimitive$2:TFunction()
  }
  scope @1 [2:3] deps=[] out=[$11_@1] {
    [2] Const mutate $11_@1:TPrimitive = Call mutate makeSomePrimitive$2:TFunction()
  }
  scope @2 [3:4] deps=[read $10_@0:TPrimitive, read $11_@1:TPrimitive] out=[x$12_@2] {
    [3] Const mutate x$12_@2:TObject = Object { u: read $10_@0:TPrimitive, v: read $11_@1:TPrimitive }
  }
  [4] Const mutate u$13:TPrimitive = read x$12_@2.u
  [5] Const mutate v$14:TPrimitive = read x$12_@2.v
  [6] Const mutate $15:TPrimitive = Binary read u$13:TPrimitive > read v$14:TPrimitive
  if (read $15:TPrimitive) {
  }
  [8] Const mutate y$16:TPrimitive = read x$12_@2.u
  [9] Const mutate z$17:TPrimitive = read x$12_@2.v
  return
}

```

## Code

```javascript
function component$0() {
  const $ = React.useMemoCache();
  let t0$10;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0$10 = makeSomePrimitive$2();
    $[0] = t0$10;
  } else {
    t0$10 = $[0];
  }

  let t1$11;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1$11 = makeSomePrimitive$2();
    $[1] = t1$11;
  } else {
    t1$11 = $[1];
  }

  const c_2 = $[2] !== t0$10;
  const c_3 = $[3] !== t1$11;
  let x$12;

  if (c_2 || c_3) {
    x$12 = {
      u: t0$10,
      v: t1$11,
    };
    $[2] = t0$10;
    $[3] = t1$11;
    $[4] = x$12;
  } else {
    x$12 = $[4];
  }

  const u$13 = x$12.u;
  const v$14 = x$12.v;

  if (u$13 > v$14) {
  }

  const y$16 = x$12.u;
  const z$17 = x$12.v;
}

```
      