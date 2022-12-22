
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  switch (props.p0) {
    case 1: {
      break;
    }
    case true: {
      x.push(props.p2);
      y = [];
    }
    default: {
      break;
    }
    case false: {
      y = x;
      break;
    }
  }
  const child = <Component data={x} />;
  y.push(props.p4);
  return <Component data={y}>{child}</Component>;
}

```

## HIR

```
bb0:
  [1] Const mutate x$10_@1[1:12] = Array []
  [2] Const mutate y$11:TPrimitive = undefined
  [3] Const mutate $12:TPrimitive = false
  [4] Const mutate $13:TPrimitive = true
  [5] Const mutate $14:TPrimitive = 1
  [6] Let mutate y$0$20_@1[1:12] = read y$11:TPrimitive
  [6] Switch (read props$9.p0)
    Case read $14:TPrimitive: bb1
    Case read $13:TPrimitive: bb6
    Default: bb1
    Case read $12:TPrimitive: bb2
    Fallthrough: bb1
bb6:
  predecessor blocks: bb0
  [7] Call mutate x$10_@1.push(read props$9.p2)
  [8] Const mutate y$1$15_@2 = Array []
  [9] Reassign mutate y$0$20_@1[1:12] = read y$1$15_@2
  [9] Goto bb1
bb2:
  predecessor blocks: bb0
  [10] Const mutate y$2$16 = read x$10_@1
  [11] Reassign mutate y$0$20_@1[1:12] = read y$2$16
  [11] Goto bb1
bb1:
  predecessor blocks: bb0 bb6 bb2
  [12] Const mutate child$19_@3 = JSX <read Component$0 data={freeze x$10_@1} ></read Component$0>
  [13] Call read y$0$20_@1.push(read props$9.p4)
  [14] Const mutate t8$22_@4 = JSX <read Component$0 data={freeze y$0$20_@1} >{read child$19_@3}</read Component$0>
  [15] Return read t8$22_@4
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @1 [1:12] deps=[read props$9.p0, read props$9.p2] out=[x$10_@1] {
    [1] Const mutate x$10_@1[1:12] = Array []
    [2] Const mutate y$11:TPrimitive = undefined
    [3] Const mutate $12:TPrimitive = false
    [4] Const mutate $13:TPrimitive = true
    [5] Const mutate $14:TPrimitive = 1
    [6] Let mutate y$0$20_@1[1:12] = read y$11:TPrimitive
    switch (read props$9.p0) {
      case read $14:TPrimitive: {
          break bb1
      }
      case read $13:TPrimitive: {
          [7] Call mutate x$10_@1.push(read props$9.p2)
          scope @2 [8:9] deps=[] out=[y$1$15_@2] {
            [8] Const mutate y$1$15_@2 = Array []
          }
          [9] Reassign mutate y$0$20_@1[1:12] = read y$1$15_@2
          break bb1
      }
      default: {
          break bb1
      }
      case read $12:TPrimitive: {
          [10] Const mutate y$2$16 = read x$10_@1
          [11] Reassign mutate y$0$20_@1[1:12] = read y$2$16
      }
    }
  }
  scope @3 [12:13] deps=[freeze x$10_@1] out=[child$19_@3] {
    [12] Const mutate child$19_@3 = JSX <read Component$0 data={freeze x$10_@1} ></read Component$0>
  }
  [13] Call read y$0$20_@1.push(read props$9.p4)
  scope @4 [14:15] deps=[freeze y$0$20_@1, read child$19_@3] out=[$22_@4] {
    [14] Const mutate $22_@4 = JSX <read Component$0 data={freeze y$0$20_@1} >{read child$19_@3}</read Component$0>
  }
  return read $22_@4
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p2;
  let x;
  if (c_0 || c_1) {
    x = [];
    const y = undefined;
    let y$0 = y;

    bb1: switch (props.p0) {
      case 1: {
        break bb1;
      }

      case true: {
        x.push(props.p2);
        let y$1;

        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
          y$1 = [];
          $[3] = y$1;
        } else {
          y$1 = $[3];
        }

        y$0 = y$1;
        break bb1;
      }

      default: {
        break bb1;
      }

      case false: {
        const y$2 = x;
        y$0 = y$2;
      }
    }

    $[0] = props.p0;
    $[1] = props.p2;
    $[2] = x;
  } else {
    x = $[2];
  }

  const c_4 = $[4] !== x;
  let child;

  if (c_4) {
    child = <Component data={x}></Component>;
    $[4] = x;
    $[5] = child;
  } else {
    child = $[5];
  }

  y$0.push(props.p4);
  const c_6 = $[6] !== y$0;
  const c_7 = $[7] !== child;
  let t8;

  if (c_6 || c_7) {
    t8 = <Component data={y$0}>{child}</Component>;
    $[6] = y$0;
    $[7] = child;
    $[8] = t8;
  } else {
    t8 = $[8];
  }

  return t8;
}

```
      