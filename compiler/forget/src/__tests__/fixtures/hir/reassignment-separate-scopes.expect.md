
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    x.push(a);
  }
  let y = <div>{x}</div>;

  switch (b) {
    case 0: {
      x = [];
      x.push(b);
      break;
    }
    default: {
      x = [];
      x.push(c);
    }
  }
  return (
    <div>
      {y}
      {x}
    </div>
  );
}

```

## HIR

```
bb0:
  [1] Const mutate x$16_@0:TFunction[1:5] = Array []
  [2] If (read a$13) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Call mutate x$16_@0.push(read a$13)
  [4] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [5] Const mutate $17_@1:TPrimitive = "div"
  [6] Const mutate y$19_@2 = JSX <read $17_@1:TPrimitive>{freeze x$16_@0:TFunction}</read $17_@1:TPrimitive>
  [7] Const mutate $20_@3:TPrimitive = 0
  [8] Let mutate x$22_@4:TFunction[8:15] = undefined
  [8] Switch (read b$14)
    Case read $20_@3:TPrimitive: bb5
    Default: bb4
    Fallthrough: bb3
bb5:
  predecessor blocks: bb1
  [9] Reassign mutate x$22_@4:TFunction[8:15] = Array []
  [10] Call mutate x$22_@4.push(read b$14)
  [11] Goto bb3
bb4:
  predecessor blocks: bb1
  [12] Reassign mutate x$22_@4:TFunction[8:15] = Array []
  [13] Call mutate x$22_@4.push(read c$15)
  [14] Goto bb3
bb3:
  predecessor blocks: bb5 bb4
  [15] Const mutate $25_@5:TPrimitive = "div"
  [16] Const mutate $26_@6 = "\n      "
  [17] Const mutate $27_@7 = "\n      "
  [18] Const mutate $28_@8 = "\n    "
  [19] Const mutate $31_@9 = JSX <read $25_@5:TPrimitive>{read $26_@6}{read y$19_@2}{read $27_@7}{freeze x$22_@4:TFunction}{read $28_@8}</read $25_@5:TPrimitive>
  [20] Return read $31_@9
scope0 [1:5]:
  - dependency: read a$13
  - dependency: read a$13
scope2 [6:7]:
  - dependency: read $17_@1:TPrimitive
  - dependency: freeze x$16_@0:TFunction
scope4 [8:15]:
  - dependency: read c$15
  - dependency: read b$14
  - dependency: read b$14
scope9 [19:20]:
  - dependency: read $25_@5:TPrimitive
  - dependency: read $26_@6
  - dependency: read y$19_@2
  - dependency: read $27_@7
  - dependency: freeze x$22_@4:TFunction
  - dependency: read $28_@8
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:5] deps=[read a$13, read a$13] {
    [1] Const mutate x$16_@0:TFunction[1:5] = Array []
    if (read a$13) {
      [3] Call mutate x$16_@0.push(read a$13)
    }
  }
  [5] Const mutate $17_@1:TPrimitive = "div"
  scope @2 [6:7] deps=[read $17_@1:TPrimitive, freeze x$16_@0:TFunction] {
    [6] Const mutate y$19_@2 = JSX <read $17_@1:TPrimitive>{freeze x$16_@0:TFunction}</read $17_@1:TPrimitive>
  }
  [7] Const mutate $20_@3:TPrimitive = 0
  scope @4 [8:15] deps=[read c$15, read b$14, read b$14] {
    [8] Let mutate x$22_@4:TFunction[8:15] = undefined
    switch (read b$14) {
      case read $20_@3:TPrimitive: {
          [9] Reassign mutate x$22_@4:TFunction[8:15] = Array []
          [10] Call mutate x$22_@4.push(read b$14)
          break bb3
      }
      default: {
          [12] Reassign mutate x$22_@4:TFunction[8:15] = Array []
          [13] Call mutate x$22_@4.push(read c$15)
      }
    }
  }
  [15] Const mutate $25_@5:TPrimitive = "div"
  [16] Const mutate $26_@6 = "\n      "
  [17] Const mutate $27_@7 = "\n      "
  [18] Const mutate $28_@8 = "\n    "
  scope @9 [19:20] deps=[read $25_@5:TPrimitive, read $26_@6, read y$19_@2, read $27_@7, freeze x$22_@4:TFunction, read $28_@8] {
    [19] Const mutate $31_@9 = JSX <read $25_@5:TPrimitive>{read $26_@6}{read y$19_@2}{read $27_@7}{freeze x$22_@4:TFunction}{read $28_@8}</read $25_@5:TPrimitive>
  }
  return read $31_@9
}

```

## Code

```javascript
function foo$0(a$13, b$14, c$15) {
  const x$16 = [];
  bb1: if (a$13) {
    x$16.push(a$13);
  }

  const y$19 = <div>{x$16}</div>;
  let x$22 = undefined;

  bb3: switch (b$14) {
    case 0: {
      x$22 = [];
      x$22.push(b$14);
      break bb3;
    }

    default: {
      x$22 = [];
      x$22.push(c$15);
    }
  }

  return (
    <div>
      {y$19}
      {x$22}
    </div>
  );
}

```
      