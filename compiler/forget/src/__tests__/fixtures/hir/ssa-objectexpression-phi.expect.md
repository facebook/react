
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
  [1] Let mutate x$6_@0:TPrimitive[1:10] = 1
  [2] Let mutate y$7_@0:TPrimitive[1:10] = 2
  [3] Const mutate $8:TPrimitive = 1
  [4] Const mutate $9:TPrimitive = Binary read x$6_@0:TPrimitive > read $8:TPrimitive
  [5] If (read $9:TPrimitive) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Reassign mutate x$6_@0:TPrimitive[1:10] = 2
  [7] Goto bb1
bb3:
  predecessor blocks: bb0
  [8] Reassign mutate y$7_@0:TPrimitive[1:10] = 3
  [9] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [10] Const mutate t$14_@2:TObject = Object { x: read x$6_@0:TPrimitive, y: read y$7_@0:TPrimitive }
  [11] Return freeze t$14_@2:TObject
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:10] deps=[] out=[x$6_@0] {
    [1] Let mutate x$6_@0:TPrimitive[1:10] = 1
    [2] Let mutate y$7_@0:TPrimitive[1:10] = 2
    [3] Const mutate $8:TPrimitive = 1
    [4] Const mutate $9:TPrimitive = Binary read x$6_@0:TPrimitive > read $8:TPrimitive
    if (read $9:TPrimitive) {
      [6] Reassign mutate x$6_@0:TPrimitive[1:10] = 2
    } else {
      [8] Reassign mutate y$7_@0:TPrimitive[1:10] = 3
    }
  }
  scope @2 [10:11] deps=[read x$6_@0:TPrimitive, read y$7_@0:TPrimitive] out=[t$14_@2] {
    [10] Const mutate t$14_@2:TObject = Object { x: read x$6_@0:TPrimitive, y: read y$7_@0:TPrimitive }
  }
  return freeze t$14_@2:TObject
}

```

## Code

```javascript
function foo$0() {
  const $ = React.useMemoCache();
  let x$6;
  if (true) {
    x$6 = 1;
    let y$7 = 2;

    bb1: if (x$6 > 1) {
      x$6 = 2;
    } else {
      y$7 = 3;
    }

    $[0] = x$6;
  } else {
    x$6 = $[0];
  }

  const c_1 = $[1] !== x$6;
  const c_2 = $[2] !== y$7;
  let t$14;

  if (c_1 || c_2) {
    t$14 = {
      x: x$6,
      y: y$7,
    };
    $[1] = x$6;
    $[2] = y$7;
    $[3] = t$14;
  } else {
    t$14 = $[3];
  }

  return t$14;
}

```
      