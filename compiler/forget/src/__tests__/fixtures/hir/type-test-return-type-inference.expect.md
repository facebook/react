
## Input

```javascript
function component() {
  let x = foo();
  let y = foo();
  if (x > y) {
    let z = {};
  }

  let z = foo();
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0:TPrimitive = Call mutate foo$1:TFunction()
  [2] Const mutate y$8_@1:TPrimitive = Call mutate foo$1:TFunction()
  [3] Const mutate $9:TPrimitive = Binary read x$7_@0:TPrimitive > read y$8_@1:TPrimitive
  [4] If (read $9:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate z$10_@2:TObject = Object {  }
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Const mutate z$12_@3 = Call mutate foo$1:TFunction()
  [8] Return
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] out=[x$7_@0] {
    [1] Const mutate x$7_@0:TPrimitive = Call mutate foo$1:TFunction()
  }
  scope @1 [2:3] deps=[] out=[y$8_@1] {
    [2] Const mutate y$8_@1:TPrimitive = Call mutate foo$1:TFunction()
  }
  [3] Const mutate $9:TPrimitive = Binary read x$7_@0:TPrimitive > read y$8_@1:TPrimitive
  if (read $9:TPrimitive) {
    [5] Const mutate z$10_@2:TObject = Object {  }
  }
  [7] Const mutate z$12_@3 = Call mutate foo$1:TFunction()
  return
}

```

## Code

```javascript
function component$0() {
  const $ = React.useMemoCache();
  let x$7;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$7 = foo$1();
    $[0] = x$7;
  } else {
    x$7 = $[0];
  }

  let y$8;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    y$8 = foo$1();
    $[1] = y$8;
  } else {
    y$8 = $[1];
  }

  if (x$7 > y$8) {
    const z$10 = {};
  }

  const z$12 = foo$1();
}

```
      