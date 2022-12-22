
## Input

```javascript
function foo() {
  let x = 1;
  while (x < 10) {
    x = x + 1;
  }

  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$5_@0:TPrimitive[1:9] = 1
  [2] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb3
  [3] Const mutate $6:TPrimitive = 10
  [4] Const mutate $8:TPrimitive = Binary read x$5_@0:TPrimitive < read $6:TPrimitive
  [5] If (read $8:TPrimitive) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [6] Const mutate $9:TPrimitive = 1
  [7] Reassign mutate x$5_@0:TPrimitive[1:9] = Binary read x$5_@0:TPrimitive + read $9:TPrimitive
  [8] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [9] Return read x$5_@0:TPrimitive
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:9] deps=[] out=[x$5_@0] {
    [1] Let mutate x$5_@0:TPrimitive[1:9] = 1
    while (
      [3] Const mutate $6:TPrimitive = 10
      [4] Const mutate $8:TPrimitive = Binary read x$5_@0:TPrimitive < read $6:TPrimitive
      read $8:TPrimitive
    ) {
      [6] Const mutate $9:TPrimitive = 1
      [7] Reassign mutate x$5_@0:TPrimitive[1:9] = Binary read x$5_@0:TPrimitive + read $9:TPrimitive
    }
  }
  return read x$5_@0:TPrimitive
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = 1;

    while (x < 10) {
      x = x + 1;
    }

    $[0] = x;
  } else {
    x = $[0];
  }

  return x;
}

```
      