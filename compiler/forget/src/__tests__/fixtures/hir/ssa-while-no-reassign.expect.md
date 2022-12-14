
## Input

```javascript
function foo() {
  let x = 1;
  while (x < 10) {
    x + 1;
  }

  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$5:TPrimitive = 1
  [2] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb3
  [3] Const mutate $6:TPrimitive = 10
  [4] Const mutate $8:TPrimitive = Binary read x$5:TPrimitive < read $6:TPrimitive
  [5] If (read $8:TPrimitive) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [6] Const mutate $9:TPrimitive = 1
  [7] Binary read x$5:TPrimitive + read $9:TPrimitive
  [8] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [9] Return read x$5:TPrimitive

```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$5:TPrimitive = 1
  while (
    [3] Const mutate $6:TPrimitive = 10
    [4] Const mutate $8:TPrimitive = Binary read x$5:TPrimitive < read $6:TPrimitive
    read $8:TPrimitive
  ) {
    [6] Const mutate $9:TPrimitive = 1
    [7] Binary read x$5:TPrimitive + read $9:TPrimitive
  }
  return read x$5:TPrimitive
}

```

## Code

```javascript
function foo$0() {
  const x$5 = 1;
  bb2: while (x$5 < 10) {
    x$5 + 1;
  }

  return x$5;
}

```
      