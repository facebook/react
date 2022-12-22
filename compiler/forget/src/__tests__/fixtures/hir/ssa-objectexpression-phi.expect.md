
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
  [5] Let mutate x$0$12_@0[1:10] = read x$6:TPrimitive
  [5] Let mutate y$1$13_@0[1:10] = read y$7:TPrimitive
  [5] If (read $9:TPrimitive) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Const mutate x$2$10:TPrimitive = 2
  [7] Reassign mutate x$0$12_@0[1:10] = read x$2$10:TPrimitive
  [7] Goto bb1
bb3:
  predecessor blocks: bb0
  [8] Const mutate y$3$11:TPrimitive = 3
  [9] Reassign mutate y$1$13_@0[1:10] = read y$3$11:TPrimitive
  [9] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [10] Const mutate t$14_@2:TObject = Object { x: read x$0$12_@0, y: read y$1$13_@0 }
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
  scope @0 [1:10] deps=[] out=[x$0$12_@0] {
    [5] Let mutate x$0$12_@0[1:10] = read x$6:TPrimitive
    [5] Let mutate y$1$13_@0[1:10] = read y$7:TPrimitive
    if (read $9:TPrimitive) {
      [6] Const mutate x$2$10:TPrimitive = 2
      [7] Reassign mutate x$0$12_@0[1:10] = read x$2$10:TPrimitive
    } else {
      [8] Const mutate y$3$11:TPrimitive = 3
      [9] Reassign mutate y$1$13_@0[1:10] = read y$3$11:TPrimitive
    }
  }
  scope @2 [10:11] deps=[read x$0$12_@0, read y$1$13_@0] out=[t$14_@2] {
    [10] Const mutate t$14_@2:TObject = Object { x: read x$0$12_@0, y: read y$1$13_@0 }
  }
  return freeze t$14_@2:TObject
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const x = 1;
  const y = 2;
  let x$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$0 = x;
    let y$1 = y;

    if (x > 1) {
      const x$2 = 2;
      x$0 = x$2;
    } else {
      const y$3 = 3;
      y$1 = y$3;
    }

    $[0] = x$0;
  } else {
    x$0 = $[0];
  }

  const c_1 = $[1] !== x$0;
  const c_2 = $[2] !== y$1;
  let t;

  if (c_1 || c_2) {
    t = {
      x: x$0,
      y: y$1,
    };
    $[1] = x$0;
    $[2] = y$1;
    $[3] = t;
  } else {
    t = $[3];
  }

  return t;
}

```
      