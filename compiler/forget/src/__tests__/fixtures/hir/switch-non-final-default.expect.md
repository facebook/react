
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
  [1] Const mutate x$10_@1:TFunction[1:12] = Array []
  [2] Let mutate y$11_@1:TPrimitive[1:12] = undefined
  [3] Const mutate $12:TPrimitive = false
  [4] Const mutate $13:TPrimitive = true
  [5] Const mutate $14:TPrimitive = 1
  [6] Switch (read props$9.p0)
    Case read $14:TPrimitive: bb1
    Case read $13:TPrimitive: bb6
    Default: bb1
    Case read $12:TPrimitive: bb2
    Fallthrough: bb1
bb6:
  predecessor blocks: bb0
  [7] Call mutate x$10_@1.push(read props$9.p2)
  [8] Reassign mutate y$11_@1:TPrimitive[1:12] = Array []
  [9] Goto bb1
bb2:
  predecessor blocks: bb0
  [10] Reassign mutate y$11_@1:TPrimitive[1:12] = read x$10_@1:TFunction
  [11] Goto bb1
bb1:
  predecessor blocks: bb0 bb6 bb2
  [12] Const mutate child$19_@2 = JSX <read Component$0 data={freeze x$10_@1:TFunction} ></read Component$0>
  [13] Call read y$11_@1.push(read props$9.p4)
  [14] Const mutate t7$22_@3 = JSX <read Component$0 data={freeze y$11_@1:TPrimitive} >{read child$19_@2}</read Component$0>
  [15] Return read t7$22_@3
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @1 [1:12] deps=[read props$9.p0, read props$9.p2] out=[x$10_@1] {
    [1] Const mutate x$10_@1:TFunction[1:12] = Array []
    [2] Let mutate y$11_@1:TPrimitive[1:12] = undefined
    [3] Const mutate $12:TPrimitive = false
    [4] Const mutate $13:TPrimitive = true
    [5] Const mutate $14:TPrimitive = 1
    switch (read props$9.p0) {
      case read $14:TPrimitive: {
          break bb1
      }
      case read $13:TPrimitive: {
          [7] Call mutate x$10_@1.push(read props$9.p2)
          [8] Reassign mutate y$11_@1:TPrimitive[1:12] = Array []
          break bb1
      }
      default: {
          break bb1
      }
      case read $12:TPrimitive: {
          [10] Reassign mutate y$11_@1:TPrimitive[1:12] = read x$10_@1:TFunction
      }
    }
  }
  scope @2 [12:13] deps=[freeze x$10_@1:TFunction] out=[child$19_@2] {
    [12] Const mutate child$19_@2 = JSX <read Component$0 data={freeze x$10_@1:TFunction} ></read Component$0>
  }
  [13] Call read y$11_@1.push(read props$9.p4)
  scope @3 [14:15] deps=[freeze y$11_@1:TPrimitive, read child$19_@2] out=[$22_@3] {
    [14] Const mutate $22_@3 = JSX <read Component$0 data={freeze y$11_@1:TPrimitive} >{read child$19_@2}</read Component$0>
  }
  return read $22_@3
}

```

## Code

```javascript
function Component$0(props$9) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props$9.p0;
  const c_1 = $[1] !== props$9.p2;
  let x$10;
  if (c_0 || c_1) {
    x$10 = [];
    let y$11 = undefined;

    bb1: switch (props$9.p0) {
      case 1: {
        break bb1;
      }

      case true: {
        x$10.push(props$9.p2);
        y$11 = [];
        break bb1;
      }

      default: {
        break bb1;
      }

      case false: {
        y$11 = x$10;
      }
    }

    $[0] = props$9.p0;
    $[1] = props$9.p2;
    $[2] = x$10;
  } else {
    x$10 = $[2];
  }

  const c_3 = $[3] !== x$10;
  let child$19;

  if (c_3) {
    child$19 = <Component$0 data={x$10}></Component$0>;
    $[3] = x$10;
    $[4] = child$19;
  } else {
    child$19 = $[4];
  }

  y$11.push(props$9.p4);
  const c_5 = $[5] !== y$11;
  const c_6 = $[6] !== child$19;
  let t7$22;

  if (c_5 || c_6) {
    t7$22 = <Component$0 data={y$11}>{child$19}</Component$0>;
    $[5] = y$11;
    $[6] = child$19;
    $[7] = t7$22;
  } else {
    t7$22 = $[7];
  }

  return t7$22;
}

```
      