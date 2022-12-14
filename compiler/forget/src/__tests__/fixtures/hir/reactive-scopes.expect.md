
## Input

```javascript
function f(a, b) {
  let x = []; // <- x starts being mutable here.
  if (a.length === 1) {
    if (b) {
      x.push(b); // <- x stops being mutable here.
    }
  }

  return <div>{x}</div>;
}

```

## HIR

```
bb0:
  [1] Const mutate x$10_@0:TFunction[1:8] = Array []
  [2] Const mutate $11_@1:TPrimitive = 1
  [3] Const mutate $12_@2:TPrimitive = Binary read a$8.length === read $11_@1:TPrimitive
  [4] If (read $12_@2:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] If (read b$9) then:bb4 else:bb1 fallthrough=bb1
bb4:
  predecessor blocks: bb2
  [6] Call mutate x$10_@0.push(read b$9)
  [7] Goto bb1
bb1:
  predecessor blocks: bb4 bb2 bb0
  [8] Const mutate $13_@3:TPrimitive = "div"
  [9] Const mutate $15_@4 = JSX <read $13_@3:TPrimitive>{freeze x$10_@0:TFunction}</read $13_@3:TPrimitive>
  [10] Return read $15_@4
scope0 [1:8]:
  - dependency: read b$9
  - dependency: read b$9
scope2 [3:4]:
  - dependency: read a$8.length
  - dependency: read $11_@1:TPrimitive
scope4 [9:10]:
  - dependency: read $13_@3:TPrimitive
  - dependency: freeze x$10_@0:TFunction
```

## Reactive Scopes

```
function f(
  a,
  b,
) {
  scope @0 [1:8] deps=[read b$9, read b$9] {
    [1] Const mutate x$10_@0:TFunction[1:8] = Array []
    [2] Const mutate $11_@1:TPrimitive = 1
    [3] Const mutate $12_@2:TPrimitive = Binary read a$8.length === read $11_@1:TPrimitive
    if (read $12_@2:TPrimitive) {
      if (read b$9) {
        [6] Call mutate x$10_@0.push(read b$9)
      }
    }
  }
  [8] Const mutate $13_@3:TPrimitive = "div"
  scope @4 [9:10] deps=[read $13_@3:TPrimitive, freeze x$10_@0:TFunction] {
    [9] Const mutate $15_@4 = JSX <read $13_@3:TPrimitive>{freeze x$10_@0:TFunction}</read $13_@3:TPrimitive>
  }
  return read $15_@4
}

```

## Code

```javascript
function f$0(a$8, b$9) {
  const x$10 = [];
  bb1: if (a$8.length === 1) {
    if (b$9) {
      x$10.push(b$9);
    }
  }

  return <div>{x$10}</div>;
}

```
      