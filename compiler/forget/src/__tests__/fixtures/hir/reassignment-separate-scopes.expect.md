
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
  [1] Const mutate x$16_@0[1:5] = Array []
  [2] If (read a$13) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Call mutate x$16_@0.push(read a$13)
  [4] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [5] Const mutate $17:TPrimitive = "div"
  [6] Const mutate y$19_@1 = JSX <read $17:TPrimitive>{freeze x$16_@0}</read $17:TPrimitive>
  [7] Const mutate $20:TPrimitive = 0
  [8] Let mutate x$30_@2[8:15] = undefined
  [8] Switch (read b$14)
    Case read $20:TPrimitive: bb5
    Default: bb4
    Fallthrough: bb3
bb5:
  predecessor blocks: bb1
  [9] Const mutate x$22_@3[9:11] = Array []
  [10] Call mutate x$22_@3.push(read b$14)
  [11] Reassign mutate x$30_@2[8:15] = read x$22_@3
  [11] Goto bb3
bb4:
  predecessor blocks: bb1
  [12] Const mutate x$23_@4[12:14] = Array []
  [13] Call mutate x$23_@4.push(read c$15)
  [14] Reassign mutate x$30_@2[8:15] = read x$23_@4
  [14] Goto bb3
bb3:
  predecessor blocks: bb5 bb4
  [15] Const mutate $25:TPrimitive = "div"
  [16] Const mutate $26 = "\n      "
  [17] Const mutate $27 = "\n      "
  [18] Const mutate $28 = "\n    "
  [19] Const mutate t13$31_@5 = JSX <read $25:TPrimitive>{read $26}{read y$19_@1}{read $27}{freeze x$30_@2}{read $28}</read $25:TPrimitive>
  [20] Return read t13$31_@5
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:5] deps=[read a$13] out=[x$16_@0] {
    [1] Const mutate x$16_@0[1:5] = Array []
    if (read a$13) {
      [3] Call mutate x$16_@0.push(read a$13)
    }
  }
  [5] Const mutate $17:TPrimitive = "div"
  scope @1 [6:7] deps=[freeze x$16_@0] out=[y$19_@1] {
    [6] Const mutate y$19_@1 = JSX <read $17:TPrimitive>{freeze x$16_@0}</read $17:TPrimitive>
  }
  [7] Const mutate $20:TPrimitive = 0
  scope @2 [8:15] deps=[read b$14, read c$15] out=[x$30_@2] {
    [8] Let mutate x$30_@2[8:15] = undefined
    switch (read b$14) {
      case read $20:TPrimitive: {
          scope @3 [9:11] deps=[read b$14] out=[x$22_@3] {
            [9] Const mutate x$22_@3[9:11] = Array []
            [10] Call mutate x$22_@3.push(read b$14)
          }
          [11] Reassign mutate x$30_@2[8:15] = read x$22_@3
          break bb3
      }
      default: {
          scope @4 [12:14] deps=[read c$15] out=[x$23_@4] {
            [12] Const mutate x$23_@4[12:14] = Array []
            [13] Call mutate x$23_@4.push(read c$15)
          }
          [14] Reassign mutate x$30_@2[8:15] = read x$23_@4
      }
    }
  }
  [15] Const mutate $25:TPrimitive = "div"
  [16] Const mutate $26 = "\n      "
  [17] Const mutate $27 = "\n      "
  [18] Const mutate $28 = "\n    "
  scope @5 [19:20] deps=[read y$19_@1, freeze x$30_@2] out=[$31_@5] {
    [19] Const mutate $31_@5 = JSX <read $25:TPrimitive>{read $26}{read y$19_@1}{read $27}{freeze x$30_@2}{read $28}</read $25:TPrimitive>
  }
  return read $31_@5
}

```

## Code

```javascript
function foo$0(a$13, b$14, c$15) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a$13;
  let x$16;
  if (c_0) {
    x$16 = [];

    if (a$13) {
      x$16.push(a$13);
    }

    $[0] = a$13;
    $[1] = x$16;
  } else {
    x$16 = $[1];
  }

  const c_2 = $[2] !== x$16;
  let y$19;

  if (c_2) {
    y$19 = <div>{x$16}</div>;
    $[2] = x$16;
    $[3] = y$19;
  } else {
    y$19 = $[3];
  }

  const c_4 = $[4] !== b$14;
  const c_5 = $[5] !== c$15;
  let x$30;

  if (c_4 || c_5) {
    x$30 = undefined;

    bb3: switch (b$14) {
      case 0: {
        const c_7 = $[7] !== b$14;
        let x$22;

        if (c_7) {
          x$22 = [];
          x$22.push(b$14);
          $[7] = b$14;
          $[8] = x$22;
        } else {
          x$22 = $[8];
        }

        x$30 = x$22;
        break bb3;
      }

      default: {
        const c_9 = $[9] !== c$15;
        let x$23;

        if (c_9) {
          x$23 = [];
          x$23.push(c$15);
          $[9] = c$15;
          $[10] = x$23;
        } else {
          x$23 = $[10];
        }

        x$30 = x$23;
      }
    }

    $[4] = b$14;
    $[5] = c$15;
    $[6] = x$30;
  } else {
    x$30 = $[6];
  }

  const c_11 = $[11] !== y$19;
  const c_12 = $[12] !== x$30;
  let t13$31;

  if (c_11 || c_12) {
    t13$31 = (
      <div>
        {y$19}
        {x$30}
      </div>
    );
    $[11] = y$19;
    $[12] = x$30;
    $[13] = t13$31;
  } else {
    t13$31 = $[13];
  }

  return t13$31;
}

```
      