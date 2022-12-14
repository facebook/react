
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
  [4] Let mutate y$8_@0:TPrimitive[4:9] = undefined
  [4] If (read $7:TPrimitive) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate y$8_@0:TPrimitive[4:9] = 1
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Reassign mutate y$8_@0:TPrimitive[4:9] = 2
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Const mutate x$11 = read y$8_@0:TPrimitive
  [10] Return
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate y$5:TPrimitive = 2
  [2] Const mutate $6:TPrimitive = 1
  [3] Const mutate $7:TPrimitive = Binary read y$5:TPrimitive > read $6:TPrimitive
  scope @0 [4:9] deps=[] {
    [4] Let mutate y$8_@0:TPrimitive[4:9] = undefined
    if (read $7:TPrimitive) {
      [5] Reassign mutate y$8_@0:TPrimitive[4:9] = 1
    } else {
      [7] Reassign mutate y$8_@0:TPrimitive[4:9] = 2
    }
  }
  [9] Const mutate x$11 = read y$8_@0:TPrimitive
  return
}

```

## Code

```javascript
function foo$0() {
  const y$5 = 2;
  let y$8 = undefined;
  bb1: if (y$5 > 1) {
    y$8 = 1;
  } else {
    y$8 = 2;
  }

  const x$11 = y$8;
}

```
      