
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
  if (y === 2) {
    x = 3;
  }

  y = x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$5:TPrimitive = 1
  [2] Const mutate y$6:TPrimitive = 2
  [3] Const mutate $7:TPrimitive = 2
  [4] Const mutate $8:TPrimitive = Binary read y$6:TPrimitive === read $7:TPrimitive
  [5] Let mutate x$10_@0[1:8] = read x$5:TPrimitive
  [5] If (read $8:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Const mutate x$9:TPrimitive = 3
  [7] Reassign mutate x$10_@0[1:8] = read x$9:TPrimitive
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [8] Const mutate y$11 = read x$10_@0
  [9] Return
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$5:TPrimitive = 1
  [2] Const mutate y$6:TPrimitive = 2
  [3] Const mutate $7:TPrimitive = 2
  [4] Const mutate $8:TPrimitive = Binary read y$6:TPrimitive === read $7:TPrimitive
  scope @0 [1:8] deps=[] out=[x$10_@0] {
    [5] Let mutate x$10_@0[1:8] = read x$5:TPrimitive
    if (read $8:TPrimitive) {
      [6] Const mutate x$9:TPrimitive = 3
      [7] Reassign mutate x$10_@0[1:8] = read x$9:TPrimitive
    }
  }
  [8] Const mutate y$11 = read x$10_@0
  return
}

```

## Code

```javascript
function foo$0() {
  const $ = React.useMemoCache();
  const x$5 = 1;
  const y$6 = 2;
  let x$10;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$10 = x$5;

    if (y$6 === 2) {
      const x$9 = 3;
      x$10 = x$9;
    }

    $[0] = x$10;
  } else {
    x$10 = $[0];
  }

  const y$11 = x$10;
}

```
      