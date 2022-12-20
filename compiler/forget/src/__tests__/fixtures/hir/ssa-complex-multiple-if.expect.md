
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
  if (y === 2) {
    x = 3;
  }

  if (y === 3) {
    x = 5;
  }
  y = x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$7:TPrimitive = 1
  [2] Const mutate y$8:TPrimitive = 2
  [3] Const mutate $9:TPrimitive = 2
  [4] Const mutate $10:TPrimitive = Binary read y$8:TPrimitive === read $9:TPrimitive
  [5] Let mutate x$17_@0[1:8] = read x$7:TPrimitive
  [5] If (read $10:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Const mutate x$11:TPrimitive = 3
  [7] Reassign mutate x$17_@0[1:8] = read x$11:TPrimitive
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [8] Const mutate $12:TPrimitive = 3
  [9] Const mutate $14:TPrimitive = Binary read y$8:TPrimitive === read $12:TPrimitive
  [10] Let mutate x$16_@1[1:13] = read x$17_@0
  [10] If (read $14:TPrimitive) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb1
  [11] Const mutate x$15:TPrimitive = 5
  [12] Reassign mutate x$16_@1[1:13] = read x$15:TPrimitive
  [12] Goto bb3
bb3:
  predecessor blocks: bb4 bb1
  [13] Const mutate y$18 = read x$16_@1
  [14] Return
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$7:TPrimitive = 1
  [2] Const mutate y$8:TPrimitive = 2
  [3] Const mutate $9:TPrimitive = 2
  [4] Const mutate $10:TPrimitive = Binary read y$8:TPrimitive === read $9:TPrimitive
  scope @0 [1:8] deps=[] out=[x$17_@0] {
    [5] Let mutate x$17_@0[1:8] = read x$7:TPrimitive
    if (read $10:TPrimitive) {
      [6] Const mutate x$11:TPrimitive = 3
      [7] Reassign mutate x$17_@0[1:8] = read x$11:TPrimitive
    }
  }
  [8] Const mutate $12:TPrimitive = 3
  [9] Const mutate $14:TPrimitive = Binary read y$8:TPrimitive === read $12:TPrimitive
  scope @1 [1:13] deps=[] out=[x$16_@1] {
    [10] Let mutate x$16_@1[1:13] = read x$17_@0
    if (read $14:TPrimitive) {
      [11] Const mutate x$15:TPrimitive = 5
      [12] Reassign mutate x$16_@1[1:13] = read x$15:TPrimitive
    }
  }
  [13] Const mutate y$18 = read x$16_@1
  return
}

```

## Code

```javascript
function foo$0() {
  const $ = React.useMemoCache();
  const x$7 = 1;
  const y$8 = 2;
  let x$17;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$17 = x$7;

    if (y$8 === 2) {
      const x$11 = 3;
      x$17 = x$11;
    }

    $[0] = x$17;
  } else {
    x$17 = $[0];
  }

  let x$16;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    x$16 = x$17;

    if (y$8 === 3) {
      const x$15 = 5;
      x$16 = x$15;
    }

    $[1] = x$16;
  } else {
    x$16 = $[1];
  }

  const y$18 = x$16;
}

```
      