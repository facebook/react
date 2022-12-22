
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  switch (props.p0) {
    case true: {
      x.push(props.p2);
      x.push(props.p3);
      y = [];
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
  [1] Const mutate x$9_@1[1:12] = Array []
  [2] Const mutate y$10:TPrimitive = undefined
  [3] Const mutate $11:TPrimitive = false
  [4] Const mutate $12:TPrimitive = true
  [5] Let mutate y$0$20_@1[1:12] = read y$10:TPrimitive
  [5] Switch (read props$8.p0)
    Case read $12:TPrimitive: bb4
    Case read $11:TPrimitive: bb2
    Default: bb1
    Fallthrough: bb1
bb4:
  predecessor blocks: bb0
  [6] Call mutate x$9_@1.push(read props$8.p2)
  [7] Call mutate x$9_@1.push(read props$8.p3)
  [8] Const mutate y$1$13_@2 = Array []
  [9] Goto bb2
bb2:
  predecessor blocks: bb4 bb0
  [10] Const mutate y$2$15 = read x$9_@1
  [11] Reassign mutate y$0$20_@1[1:12] = read y$2$15
  [11] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [12] Const mutate child$19_@3 = JSX <read Component$0 data={freeze x$9_@1} ></read Component$0>
  [13] Call read y$0$20_@1.push(read props$8.p4)
  [14] Const mutate t8$23_@4 = JSX <read Component$0 data={read y$0$20_@1} >{read child$19_@3}</read Component$0>
  [15] Return read t8$23_@4
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @1 [1:12] deps=[read props$8.p0, read props$8.p2, read props$8.p3] out=[x$9_@1] {
    [1] Const mutate x$9_@1[1:12] = Array []
    [2] Const mutate y$10:TPrimitive = undefined
    [3] Const mutate $11:TPrimitive = false
    [4] Const mutate $12:TPrimitive = true
    [5] Let mutate y$0$20_@1[1:12] = read y$10:TPrimitive
    switch (read props$8.p0) {
      case read $12:TPrimitive: {
          [6] Call mutate x$9_@1.push(read props$8.p2)
          [7] Call mutate x$9_@1.push(read props$8.p3)
          [8] Const mutate y$1$13_@2 = Array []
      }
      case read $11:TPrimitive: {
          [10] Const mutate y$2$15 = read x$9_@1
          [11] Reassign mutate y$0$20_@1[1:12] = read y$2$15
      }
    }
  }
  scope @3 [12:13] deps=[freeze x$9_@1] out=[child$19_@3] {
    [12] Const mutate child$19_@3 = JSX <read Component$0 data={freeze x$9_@1} ></read Component$0>
  }
  [13] Call read y$0$20_@1.push(read props$8.p4)
  scope @4 [14:15] deps=[read y$0$20_@1, read child$19_@3] out=[$23_@4] {
    [14] Const mutate $23_@4 = JSX <read Component$0 data={read y$0$20_@1} >{read child$19_@3}</read Component$0>
  }
  return read $23_@4
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p2;
  const c_2 = $[2] !== props.p3;
  let x;
  if (c_0 || c_1 || c_2) {
    x = [];
    const y = undefined;
    let y$0 = y;

    switch (props.p0) {
      case true: {
        x.push(props.p2);
        x.push(props.p3);
        const y$1 = [];
      }

      case false: {
        const y$2 = x;
        y$0 = y$2;
      }
    }

    $[0] = props.p0;
    $[1] = props.p2;
    $[2] = props.p3;
    $[3] = x;
  } else {
    x = $[3];
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
      