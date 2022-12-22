
## Input

```javascript
function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }
  throw x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4:TPrimitive = 1
  [2] Const mutate $5:TPrimitive = 1
  [3] Const mutate $6:TPrimitive = Binary read x$4:TPrimitive === read $5:TPrimitive
  [4] Let mutate x$0$8_@0[1:7] = read x$4:TPrimitive
  [4] If (read $6:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate x$1$7:TPrimitive = 2
  [6] Reassign mutate x$0$8_@0[1:7] = read x$1$7:TPrimitive
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Throw read x$0$8_@0
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$4:TPrimitive = 1
  [2] Const mutate $5:TPrimitive = 1
  [3] Const mutate $6:TPrimitive = Binary read x$4:TPrimitive === read $5:TPrimitive
  scope @0 [1:7] deps=[] out=[x$0$8_@0] {
    [4] Let mutate x$0$8_@0[1:7] = read x$4:TPrimitive
    if (read $6:TPrimitive) {
      [5] Const mutate x$1$7:TPrimitive = 2
      [6] Reassign mutate x$0$8_@0[1:7] = read x$1$7:TPrimitive
    }
  }
  throw read x$0$8_@0
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const x = 1;
  let x$0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$0 = x;

    if (x === 1) {
      const x$1 = 2;
      x$0 = x$1;
    }

    $[0] = x$0;
  } else {
    x$0 = $[0];
  }

  throw x$0;
}

```
      