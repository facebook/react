
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (x > 1) {
    x = 2;
  } else {
    y = 3;
  }

  let t = { x: x, y: y };
  return t;
}

```

## HIR

```
bb0:
  [1] Const mutate x$6:TPrimitive = 1
  [2] Const mutate y$7:TPrimitive = 2
  [3] Const mutate $8:TPrimitive = 1
  [4] Const mutate $9:TPrimitive = Binary read x$6:TPrimitive > read $8:TPrimitive
  [5] Let mutate x$12_@0[1:10] = read x$6:TPrimitive
  [5] Let mutate y$13_@0[1:10] = read y$7:TPrimitive
  [5] If (read $9:TPrimitive) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Const mutate x$10:TPrimitive = 2
  [7] Reassign mutate x$12_@0[1:10] = read x$10:TPrimitive
  [7] Goto bb1
bb3:
  predecessor blocks: bb0
  [8] Const mutate y$11:TPrimitive = 3
  [9] Reassign mutate y$13_@0[1:10] = read y$11:TPrimitive
  [9] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [10] Const mutate t$14_@2:TObject = Object { x: read x$12_@0, y: read y$13_@0 }
  [11] Return freeze t$14_@2:TObject
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$6:TPrimitive = 1
  [2] Const mutate y$7:TPrimitive = 2
  [3] Const mutate $8:TPrimitive = 1
  [4] Const mutate $9:TPrimitive = Binary read x$6:TPrimitive > read $8:TPrimitive
  scope @0 [1:10] deps=[] out=[x$12_@0] {
    [5] Let mutate x$12_@0[1:10] = read x$6:TPrimitive
    [5] Let mutate y$13_@0[1:10] = read y$7:TPrimitive
    if (read $9:TPrimitive) {
      [6] Const mutate x$10:TPrimitive = 2
      [7] Reassign mutate x$12_@0[1:10] = read x$10:TPrimitive
    } else {
      [8] Const mutate y$11:TPrimitive = 3
      [9] Reassign mutate y$13_@0[1:10] = read y$11:TPrimitive
    }
  }
  scope @2 [10:11] deps=[read x$12_@0, read y$13_@0] out=[t$14_@2] {
    [10] Const mutate t$14_@2:TObject = Object { x: read x$12_@0, y: read y$13_@0 }
  }
  return freeze t$14_@2:TObject
}

```

## Code

```javascript
function foo$0() {
  const $ = React.useMemoCache();
  const x$6 = 1;
  const y$7 = 2;
  let x$12;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$12 = x$6;
    let y$13 = y$7;

    if (x$6 > 1) {
      const x$10 = 2;
      x$12 = x$10;
    } else {
      const y$11 = 3;
      y$13 = y$11;
    }

    $[0] = x$12;
  } else {
    x$12 = $[0];
  }

  const c_1 = $[1] !== x$12;
  const c_2 = $[2] !== y$13;
  let t$14;

  if (c_1 || c_2) {
    t$14 = {
      x: x$12,
      y: y$13,
    };
    $[1] = x$12;
    $[2] = y$13;
    $[3] = t$14;
  } else {
    t$14 = $[3];
  }

  return t$14;
}

```
      