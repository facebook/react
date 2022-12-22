
## Input

```javascript
function foo() {
  let y = 2;

  if (y > 1) {
    y = 1;
  } else {
    y = 2;
  }

  let x = y;
}

```

## HIR

```
bb0:
  [1] Const mutate y$5:TPrimitive = 2
  [2] Const mutate $6:TPrimitive = 1
  [3] Const mutate $7:TPrimitive = Binary read y$5:TPrimitive > read $6:TPrimitive
  [4] Let mutate y$0$10_@0[4:9] = undefined
  [4] If (read $7:TPrimitive) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate y$1$8:TPrimitive = 1
  [6] Reassign mutate y$0$10_@0[4:9] = read y$1$8:TPrimitive
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Const mutate y$2$9:TPrimitive = 2
  [8] Reassign mutate y$0$10_@0[4:9] = read y$2$9:TPrimitive
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Const mutate x$11 = read y$0$10_@0
  [10] Return
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate y$5:TPrimitive = 2
  [2] Const mutate $6:TPrimitive = 1
  [3] Const mutate $7:TPrimitive = Binary read y$5:TPrimitive > read $6:TPrimitive
  scope @0 [4:9] deps=[] out=[y$0$10_@0] {
    [4] Let mutate y$0$10_@0[4:9] = undefined
    if (read $7:TPrimitive) {
      [5] Const mutate y$1$8:TPrimitive = 1
      [6] Reassign mutate y$0$10_@0[4:9] = read y$1$8:TPrimitive
    } else {
      [7] Const mutate y$2$9:TPrimitive = 2
      [8] Reassign mutate y$0$10_@0[4:9] = read y$2$9:TPrimitive
    }
  }
  [9] Const mutate x$11 = read y$0$10_@0
  return
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const y = 2;
  let y$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y$0 = undefined;

    if (y > 1) {
      const y$1 = 1;
      y$0 = y$1;
    } else {
      const y$2 = 2;
      y$0 = y$2;
    }

    $[0] = y$0;
  } else {
    y$0 = $[0];
  }

  const x = y$0;
}

```
      