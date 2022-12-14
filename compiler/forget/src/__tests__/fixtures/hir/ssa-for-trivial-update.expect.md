
## Input

```javascript
function foo() {
  let x = 1;
  for (let i = 0; i < 10; /* update is intentally a single identifier */ i) {
    x += 1;
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$6_@0:TPrimitive[1:13] = 1
  [2] For init=bb3 test=bb1 loop=bb5 update=bb4 fallthrough=bb2
bb3:
  predecessor blocks: bb0
  [3] Const mutate i$7:TPrimitive = 0
  [4] Goto bb1
bb1:
  predecessor blocks: bb3 bb4
  [5] Const mutate $8:TPrimitive = 10
  [6] Const mutate $10:TPrimitive = Binary read i$7:TPrimitive < read $8:TPrimitive
  [7] If (read $10:TPrimitive) then:bb5 else:bb2 fallthrough=bb2
bb5:
  predecessor blocks: bb1
  [8] Const mutate $11:TPrimitive = 1
  [9] Reassign mutate x$6_@0:TPrimitive[1:13] = Binary read x$6_@0:TPrimitive + read $11:TPrimitive
  [10] Goto(Continue) bb4
bb4:
  predecessor blocks: bb5
  [11] read i$7:TPrimitive
  [12] Goto bb1
bb2:
  predecessor blocks: bb1
  [13] Return read x$6_@0:TPrimitive

```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:13] deps=[] {
    [1] Let mutate x$6_@0:TPrimitive[1:13] = 1
    for (
      [3] Const mutate i$7:TPrimitive = 0
    ;
      [5] Const mutate $8:TPrimitive = 10
      [6] Const mutate $10:TPrimitive = Binary read i$7:TPrimitive < read $8:TPrimitive
      read $10:TPrimitive
    ;
      read i$7:TPrimitive
    ) {
      [8] Const mutate $11:TPrimitive = 1
      [9] Reassign mutate x$6_@0:TPrimitive[1:13] = Binary read x$6_@0:TPrimitive + read $11:TPrimitive
    }
  }
  return read x$6_@0:TPrimitive
}

```

## Code

```javascript
function foo$0() {
  let x$6 = 1;
  bb2: for (const i$7 = 0; i$7 < 10; i$7) {
    x$6 = x$6 + 1;
  }

  return x$6;
}

```
      