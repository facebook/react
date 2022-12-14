
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (y) {
    let z = x + y;
  }
}

```

## HIR

```
bb0:
  [1] Const mutate x$4_@0:TPrimitive = 1
  [2] Const mutate y$5_@1:TPrimitive = 2
  [3] If (read y$5_@1:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Const mutate z$6_@2:TPrimitive = Binary read x$4_@0:TPrimitive + read y$5_@1:TPrimitive
  [5] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [6] Return
scope2 [4:5]:
  - dependency: read x$4_@0:TPrimitive
  - dependency: read y$5_@1:TPrimitive
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$4_@0:TPrimitive = 1
  [2] Const mutate y$5_@1:TPrimitive = 2
  if (read y$5_@1:TPrimitive) {
    [4] Const mutate z$6_@2:TPrimitive = Binary read x$4_@0:TPrimitive + read y$5_@1:TPrimitive
  }
  return
}

```

## Code

```javascript
function foo$0() {
  const x$4 = 1;
  const y$5 = 2;
  bb1: if (y$5) {
    const z$6 = x$4 + y$5;
  }
}

```
      