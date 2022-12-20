
## Input

```javascript
function Component(props) {
  let x;
  if (props.cond) {
    switch (props.test) {
      case 0: {
        x = props.v0;
        break;
      }
      case 1: {
        x = props.v1;
        break;
      }
      case 2: {
      }
      default: {
        x = props.v2;
      }
    }
  } else {
    if (props.cond2) {
      x = props.b;
    } else {
      x = props.c;
    }
  }
  x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$7:TPrimitive = undefined
  [2] Let mutate x$16_@0[2:18] = undefined
  [2] If (read props$6.cond) then:bb2 else:bb10 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate $8:TPrimitive = 2
  [4] Const mutate $9:TPrimitive = 1
  [5] Const mutate $10:TPrimitive = 0
  [6] Switch (read props$6.test)
    Case read $10:TPrimitive: bb8
    Case read $9:TPrimitive: bb6
    Case read $8:TPrimitive: bb4
    Default: bb4
    Fallthrough: bb1
bb8:
  predecessor blocks: bb2
  [7] Const mutate x$11:TProp = read props$6.v0
  [8] Reassign mutate x$16_@0[2:18] = read x$11:TProp
  [8] Goto bb1
bb6:
  predecessor blocks: bb2
  [9] Const mutate x$12:TProp = read props$6.v1
  [10] Reassign mutate x$16_@0[2:18] = read x$12:TProp
  [10] Goto bb1
bb4:
  predecessor blocks: bb2
  [11] Const mutate x$13:TProp = read props$6.v2
  [12] Reassign mutate x$16_@0[2:18] = read x$13:TProp
  [12] Goto bb1
bb10:
  predecessor blocks: bb0
  [13] If (read props$6.cond2) then:bb12 else:bb13 fallthrough=bb1
bb12:
  predecessor blocks: bb10
  [14] Const mutate x$14:TProp = read props$6.b
  [15] Reassign mutate x$16_@0[2:18] = read x$14:TProp
  [15] Goto bb1
bb13:
  predecessor blocks: bb10
  [16] Const mutate x$15:TProp = read props$6.c
  [17] Reassign mutate x$16_@0[2:18] = read x$15:TProp
  [17] Goto bb1
bb1:
  predecessor blocks: bb8 bb6 bb4 bb12 bb13
  [18] read x$16_@0
  [19] Return
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate x$7:TPrimitive = undefined
  scope @0 [2:18] deps=[read props$6.cond, read props$6.test, read props$6.v0, read props$6.v1, read props$6.v2, read props$6.cond2, read props$6.b, read props$6.c] out=[x$16_@0] {
    [2] Let mutate x$16_@0[2:18] = undefined
    if (read props$6.cond) {
      [3] Const mutate $8:TPrimitive = 2
      [4] Const mutate $9:TPrimitive = 1
      [5] Const mutate $10:TPrimitive = 0
      switch (read props$6.test) {
        case read $10:TPrimitive: {
            [7] Const mutate x$11:TProp = read props$6.v0
            [8] Reassign mutate x$16_@0[2:18] = read x$11:TProp
            break bb1
        }
        case read $9:TPrimitive: {
            [9] Const mutate x$12:TProp = read props$6.v1
            [10] Reassign mutate x$16_@0[2:18] = read x$12:TProp
            break bb1
        }
        case read $8:TPrimitive: {
        }
        default: {
            [11] Const mutate x$13:TProp = read props$6.v2
            [12] Reassign mutate x$16_@0[2:18] = read x$13:TProp
        }
      }
    } else {
      if (read props$6.cond2) {
        [14] Const mutate x$14:TProp = read props$6.b
        [15] Reassign mutate x$16_@0[2:18] = read x$14:TProp
      } else {
        [16] Const mutate x$15:TProp = read props$6.c
        [17] Reassign mutate x$16_@0[2:18] = read x$15:TProp
      }
    }
  }
  [18] read x$16_@0
  return
}

```

## Code

```javascript
function Component$0(props$6) {
  const $ = React.useMemoCache();
  const x$7 = undefined;
  const c_0 = $[0] !== props$6.cond;
  const c_1 = $[1] !== props$6.test;
  const c_2 = $[2] !== props$6.v0;
  const c_3 = $[3] !== props$6.v1;
  const c_4 = $[4] !== props$6.v2;
  const c_5 = $[5] !== props$6.cond2;
  const c_6 = $[6] !== props$6.b;
  const c_7 = $[7] !== props$6.c;
  let x$16;
  if (c_0 || c_1 || c_2 || c_3 || c_4 || c_5 || c_6 || c_7) {
    x$16 = undefined;

    bb1: if (props$6.cond) {
      switch (props$6.test) {
        case 0: {
          const x$11 = props$6.v0;
          x$16 = x$11;
          break bb1;
        }

        case 1: {
          const x$12 = props$6.v1;
          x$16 = x$12;
          break bb1;
        }

        case 2: {
        }

        default: {
          const x$13 = props$6.v2;
          x$16 = x$13;
        }
      }
    } else {
      if (props$6.cond2) {
        const x$14 = props$6.b;
        x$16 = x$14;
      } else {
        const x$15 = props$6.c;
        x$16 = x$15;
      }
    }

    $[0] = props$6.cond;
    $[1] = props$6.test;
    $[2] = props$6.v0;
    $[3] = props$6.v1;
    $[4] = props$6.v2;
    $[5] = props$6.cond2;
    $[6] = props$6.b;
    $[7] = props$6.c;
    $[8] = x$16;
  } else {
    x$16 = $[8];
  }

  x$16;
}

```
      