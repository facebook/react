
## Input

```javascript
function foo(a, b, c) {
  const x = [];
  if (a) {
    const y = [];
    y.push(b);
    x.push(<div>{y}</div>);
  } else {
    x.push(c);
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$11_@0:TFunction[1:11] = Array []
  [2] If (read a$8) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate y$12_@1:TFunction[3:5] = Array []
  [4] Call mutate y$12_@1.push(read b$9)
  [5] Const mutate $13:TPrimitive = "div"
  [6] Const mutate $14_@2 = JSX <read $13:TPrimitive>{freeze y$12_@1:TFunction}</read $13:TPrimitive>
  [7] Call mutate x$11_@0.push(read $14_@2)
  [8] Goto bb1
bb3:
  predecessor blocks: bb0
  [9] Call mutate x$11_@0.push(read c$10)
  [10] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [11] Return freeze x$11_@0:TFunction
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:11] deps=[read a$8, read b$9, read c$10] {
    [1] Const mutate x$11_@0:TFunction[1:11] = Array []
    if (read a$8) {
      scope @1 [3:5] deps=[read b$9] {
        [3] Const mutate y$12_@1:TFunction[3:5] = Array []
        [4] Call mutate y$12_@1.push(read b$9)
      }
      [5] Const mutate $13:TPrimitive = "div"
      scope @2 [6:7] deps=[freeze y$12_@1:TFunction] {
        [6] Const mutate $14_@2 = JSX <read $13:TPrimitive>{freeze y$12_@1:TFunction}</read $13:TPrimitive>
      }
      [7] Call mutate x$11_@0.push(read $14_@2)
    } else {
      [9] Call mutate x$11_@0.push(read c$10)
    }
  }
  return freeze x$11_@0:TFunction
}

```

## Code

```javascript
function foo$0(a$8, b$9, c$10) {
  const x$11 = [];
  bb1: if (a$8) {
    const y$12 = [];
    y$12.push(b$9);
    x$11.push(<div>{y$12}</div>);
  } else {
    x$11.push(c$10);
  }

  return x$11;
}

```
      