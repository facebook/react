
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
  [1] Let mutate x$5_@0:TPrimitive[1:8] = 1
  [2] Const mutate y$6:TPrimitive = 2
  [3] Const mutate $7:TPrimitive = 2
  [4] Const mutate $8:TPrimitive = Binary read y$6:TPrimitive === read $7:TPrimitive
  [5] If (read $8:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Reassign mutate x$5_@0:TPrimitive[1:8] = 3
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [8] Const mutate y$11 = read x$5_@0:TPrimitive
  [9] Return
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:8] deps=[] out=[x$5_@0] {
    [1] Let mutate x$5_@0:TPrimitive[1:8] = 1
    [2] Const mutate y$6:TPrimitive = 2
    [3] Const mutate $7:TPrimitive = 2
    [4] Const mutate $8:TPrimitive = Binary read y$6:TPrimitive === read $7:TPrimitive
    if (read $8:TPrimitive) {
      [6] Reassign mutate x$5_@0:TPrimitive[1:8] = 3
    }
  }
  [8] Const mutate y$11 = read x$5_@0:TPrimitive
  return
}

```

## Code

```javascript
function foo$0() {
  const $ = React.useMemoCache();
  let x$5;
  if (true) {
    x$5 = 1;
    const y$6 = 2;

    bb1: if (y$6 === 2) {
      x$5 = 3;
    }

    $[0] = x$5;
  } else {
    x$5 = $[0];
  }

  const y$11 = x$5;
}

```
      