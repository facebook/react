
## Input

```javascript
function foo() {
  let x = 1;
  for (let i = 0; i < 10; i += 1) {
    x += 1;
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$7_@1:TPrimitive[1:15] = 1
  [2] For init=bb3 test=bb1 loop=bb5 update=bb4 fallthrough=bb2
bb3:
  predecessor blocks: bb0
  [3] Let mutate i$8_@1:TPrimitive[1:15] = 0
  [4] Goto bb1
bb1:
  predecessor blocks: bb3 bb4
  [5] Const mutate $9:TPrimitive = 10
  [6] Const mutate $11:TPrimitive = Binary read i$8_@1:TPrimitive < read $9:TPrimitive
  [7] If (read $11:TPrimitive) then:bb5 else:bb2 fallthrough=bb2
bb5:
  predecessor blocks: bb1
  [8] Const mutate $12:TPrimitive = 1
  [9] Reassign mutate x$7_@1:TPrimitive[1:15] = Binary read x$7_@1:TPrimitive + read $12:TPrimitive
  [10] Goto(Continue) bb4
bb4:
  predecessor blocks: bb5
  [11] Const mutate $15:TPrimitive = 1
  [12] Reassign mutate i$8_@1:TPrimitive[1:15] = Binary read i$8_@1:TPrimitive + read $15:TPrimitive
  [13] read i$8_@1:TPrimitive
  [14] Goto bb1
bb2:
  predecessor blocks: bb1
  [15] Return read x$7_@1:TPrimitive
```

## Reactive Scopes

```
function foo(
) {
  scope @1 [1:15] deps=[] out=[x$7_@1] {
    [1] Let mutate x$7_@1:TPrimitive[1:15] = 1
    for (
      [3] Let mutate i$8_@1:TPrimitive[1:15] = 0
    ;
      [5] Const mutate $9:TPrimitive = 10
      [6] Const mutate $11:TPrimitive = Binary read i$8_@1:TPrimitive < read $9:TPrimitive
      read $11:TPrimitive
    ;
      [11] Const mutate $15:TPrimitive = 1
      [12] Reassign mutate i$8_@1:TPrimitive[1:15] = Binary read i$8_@1:TPrimitive + read $15:TPrimitive
      read i$8_@1:TPrimitive
    ) {
      [8] Const mutate $12:TPrimitive = 1
      [9] Reassign mutate x$7_@1:TPrimitive[1:15] = Binary read x$7_@1:TPrimitive + read $12:TPrimitive
    }
  }
  return read x$7_@1:TPrimitive
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = 1;

    for (let i = 0; i < 10; i = i + 1, i) {
      x = x + 1;
    }

    $[0] = x;
  } else {
    x = $[0];
  }

  return x;
}

```
      