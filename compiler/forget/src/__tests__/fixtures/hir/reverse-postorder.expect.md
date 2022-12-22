
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
  [2] Let mutate x$0$16_@0[2:18] = undefined
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
  [7] Const mutate x$1$11 = read props$6.v0
  [8] Reassign mutate x$0$16_@0[2:18] = read x$1$11
  [8] Goto bb1
bb6:
  predecessor blocks: bb2
  [9] Const mutate x$2$12 = read props$6.v1
  [10] Reassign mutate x$0$16_@0[2:18] = read x$2$12
  [10] Goto bb1
bb4:
  predecessor blocks: bb2
  [11] Const mutate x$3$13 = read props$6.v2
  [12] Reassign mutate x$0$16_@0[2:18] = read x$3$13
  [12] Goto bb1
bb10:
  predecessor blocks: bb0
  [13] If (read props$6.cond2) then:bb12 else:bb13 fallthrough=bb1
bb12:
  predecessor blocks: bb10
  [14] Const mutate x$4$14 = read props$6.b
  [15] Reassign mutate x$0$16_@0[2:18] = read x$4$14
  [15] Goto bb1
bb13:
  predecessor blocks: bb10
  [16] Const mutate x$5$15 = read props$6.c
  [17] Reassign mutate x$0$16_@0[2:18] = read x$5$15
  [17] Goto bb1
bb1:
  predecessor blocks: bb8 bb6 bb4 bb12 bb13
  [18] read x$0$16_@0
  [19] Return
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate x$7:TPrimitive = undefined
  scope @0 [2:18] deps=[read props$6.cond, read props$6.test, read props$6.v0, read props$6.v1, read props$6.v2, read props$6.cond2, read props$6.b, read props$6.c] out=[x$0$16_@0] {
    [2] Let mutate x$0$16_@0[2:18] = undefined
    if (read props$6.cond) {
      [3] Const mutate $8:TPrimitive = 2
      [4] Const mutate $9:TPrimitive = 1
      [5] Const mutate $10:TPrimitive = 0
      switch (read props$6.test) {
        case read $10:TPrimitive: {
            [7] Const mutate x$1$11 = read props$6.v0
            [8] Reassign mutate x$0$16_@0[2:18] = read x$1$11
            break bb1
        }
        case read $9:TPrimitive: {
            [9] Const mutate x$2$12 = read props$6.v1
            [10] Reassign mutate x$0$16_@0[2:18] = read x$2$12
            break bb1
        }
        case read $8:TPrimitive: {
        }
        default: {
            [11] Const mutate x$3$13 = read props$6.v2
            [12] Reassign mutate x$0$16_@0[2:18] = read x$3$13
        }
      }
    } else {
      if (read props$6.cond2) {
        [14] Const mutate x$4$14 = read props$6.b
        [15] Reassign mutate x$0$16_@0[2:18] = read x$4$14
      } else {
        [16] Const mutate x$5$15 = read props$6.c
        [17] Reassign mutate x$0$16_@0[2:18] = read x$5$15
      }
    }
  }
  [18] read x$0$16_@0
  return
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const x = undefined;
  const c_0 = $[0] !== props.cond;
  const c_1 = $[1] !== props.test;
  const c_2 = $[2] !== props.v0;
  const c_3 = $[3] !== props.v1;
  const c_4 = $[4] !== props.v2;
  const c_5 = $[5] !== props.cond2;
  const c_6 = $[6] !== props.b;
  const c_7 = $[7] !== props.c;
  let x$0;
  if (c_0 || c_1 || c_2 || c_3 || c_4 || c_5 || c_6 || c_7) {
    x$0 = undefined;

    bb1: if (props.cond) {
      switch (props.test) {
        case 0: {
          const x$1 = props.v0;
          x$0 = x$1;
          break bb1;
        }

        case 1: {
          const x$2 = props.v1;
          x$0 = x$2;
          break bb1;
        }

        case 2: {
        }

        default: {
          const x$3 = props.v2;
          x$0 = x$3;
        }
      }
    } else {
      if (props.cond2) {
        const x$4 = props.b;
        x$0 = x$4;
      } else {
        const x$5 = props.c;
        x$0 = x$5;
      }
    }

    $[0] = props.cond;
    $[1] = props.test;
    $[2] = props.v0;
    $[3] = props.v1;
    $[4] = props.v2;
    $[5] = props.cond2;
    $[6] = props.b;
    $[7] = props.c;
    $[8] = x$0;
  } else {
    x$0 = $[8];
  }

  x$0;
}

```
      