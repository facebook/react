
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
  [5] Const mutate $17:TPrimitive = "div"
  [6] Const mutate y$19_@1 = JSX <read $17:TPrimitive>{freeze x$16_@0:TFunction}</read $17:TPrimitive>
  [7] Const mutate $20:TPrimitive = 0
  [8] Let mutate x$22_@2:TFunction[8:15] = undefined
  [8] Switch (read b$14)
    Case read $20:TPrimitive: bb5
    Default: bb4
    Fallthrough: bb3
bb5:
  predecessor blocks: bb1
  [9] Reassign mutate x$22_@2:TFunction[8:15] = Array []
  [10] Call mutate x$22_@2.push(read b$14)
  [11] Goto bb3
bb4:
  predecessor blocks: bb1
  [12] Reassign mutate x$22_@2:TFunction[8:15] = Array []
  [13] Call mutate x$22_@2.push(read c$15)
  [14] Goto bb3
bb3:
  predecessor blocks: bb5 bb4
  [15] Const mutate $25:TPrimitive = "div"
  [16] Const mutate $26 = "\n      "
  [17] Const mutate $27 = "\n      "
  [18] Const mutate $28 = "\n    "
  [19] Const mutate $31_@3 = JSX <read $25:TPrimitive>{read $26}{read y$19_@1}{read $27}{freeze x$22_@2:TFunction}{read $28}</read $25:TPrimitive>
  [20] Return read $31_@3
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:5] deps=[read a$13] out=[x$16_@0] {
    [1] Const mutate x$16_@0:TFunction[1:5] = Array []
    if (read a$13) {
      [3] Call mutate x$16_@0.push(read a$13)
    }
  }
  [5] Const mutate $17:TPrimitive = "div"
  scope @1 [6:7] deps=[freeze x$16_@0:TFunction] out=[y$19_@1] {
    [6] Const mutate y$19_@1 = JSX <read $17:TPrimitive>{freeze x$16_@0:TFunction}</read $17:TPrimitive>
  }
  [7] Const mutate $20:TPrimitive = 0
  scope @2 [8:15] deps=[read b$14, read c$15] out=[x$22_@2] {
    [8] Let mutate x$22_@2:TFunction[8:15] = undefined
    switch (read b$14) {
      case read $20:TPrimitive: {
          [9] Reassign mutate x$22_@2:TFunction[8:15] = Array []
          [10] Call mutate x$22_@2.push(read b$14)
          break bb3
      }
      default: {
          [12] Reassign mutate x$22_@2:TFunction[8:15] = Array []
          [13] Call mutate x$22_@2.push(read c$15)
      }
    }
  }
  [15] Const mutate $25:TPrimitive = "div"
  [16] Const mutate $26 = "\n      "
  [17] Const mutate $27 = "\n      "
  [18] Const mutate $28 = "\n    "
  scope @3 [19:20] deps=[read y$19_@1, freeze x$22_@2:TFunction] out=[$31_@3] {
    [19] Const mutate $31_@3 = JSX <read $25:TPrimitive>{read $26}{read y$19_@1}{read $27}{freeze x$22_@2:TFunction}{read $28}</read $25:TPrimitive>
  }
  return read $31_@3
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
      