
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
  [1] Const mutate x$5_@0:TPrimitive = 1
  [2] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb3
  [3] Const mutate $6_@1:TPrimitive[3:6] = 10
  [4] Const mutate $8_@2:TPrimitive[4:6] = Binary read x$5_@0:TPrimitive < read $6_@1:TPrimitive
  [5] If (read $8_@2:TPrimitive) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [6] Const mutate $9_@3:TPrimitive = 1
  [7] Binary read x$5_@0:TPrimitive + read $9_@3:TPrimitive
  [8] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [9] Return read x$5_@0:TPrimitive
scope2 [4:6]:
  - dependency: read x$5_@0:TPrimitive
scope3 [6:7]:
  - dependency: read x$5_@0:TPrimitive
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$5_@0:TPrimitive = 1
  scope @1 [3:6] deps=[] {
    scope @2 [4:6] deps=[read x$5_@0:TPrimitive] {
      while (
        [3] Const mutate $6_@1:TPrimitive[3:6] = 10
        [4] Const mutate $8_@2:TPrimitive[4:6] = Binary read x$5_@0:TPrimitive < read $6_@1:TPrimitive
        read $8_@2:TPrimitive
      ) {
        [6] Const mutate $9_@3:TPrimitive = 1
        [7] Binary read x$5_@0:TPrimitive + read $9_@3:TPrimitive
      }
    }
  }
  return read x$5_@0:TPrimitive
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
      