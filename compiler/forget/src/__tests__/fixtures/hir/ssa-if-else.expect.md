
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (y) {
    let z = x + y;
  } else {
    let z = x;
  }
}

```

## HIR

```
bb0:
  [1] Const mutate x$5:TPrimitive = 1
  [2] Const mutate y$6:TPrimitive = 2
  [3] If (read y$6:TPrimitive) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Const mutate z$7:TPrimitive = Binary read x$5:TPrimitive + read y$6:TPrimitive
  [5] Goto bb1
bb3:
  predecessor blocks: bb0
  [6] Const mutate z$8:TPrimitive = read x$5:TPrimitive
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [8] Return

```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$5:TPrimitive = 1
  [2] Const mutate y$6:TPrimitive = 2
  if (read y$6:TPrimitive) {
    [4] Const mutate z$7:TPrimitive = Binary read x$5:TPrimitive + read y$6:TPrimitive
  } else {
    [6] Const mutate z$8:TPrimitive = read x$5:TPrimitive
  }
  return
}

```

## Code

```javascript
function foo$0() {
  const x$5 = 1;
  const y$6 = 2;
  bb1: if (y$6) {
    const z$7 = x$5 + y$6;
  } else {
    const z$8 = x$5;
  }
}

```
      