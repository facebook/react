
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
  [1] Const mutate x$9_@1:TFunction[1:12] = Array []
  [2] Let mutate y$10_@1:TPrimitive[1:12] = undefined
  [3] Const mutate $11:TPrimitive = false
  [4] Const mutate $12:TPrimitive = true
  [5] Switch (read props$8.p0)
    Case read $12:TPrimitive: bb4
    Case read $11:TPrimitive: bb2
    Default: bb1
    Fallthrough: bb1
bb4:
  predecessor blocks: bb0
  [6] Call mutate x$9_@1.push(read props$8.p2)
  [7] Call mutate x$9_@1.push(read props$8.p3)
  [8] Const mutate y$13_@2 = Array []
  [9] Goto bb2
bb2:
  predecessor blocks: bb4 bb0
  [10] Reassign mutate y$10_@1:TPrimitive[1:12] = read x$9_@1:TFunction
  [11] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [12] Const mutate child$19_@3 = JSX <read Component$0 data={freeze x$9_@1:TFunction} ></read Component$0>
  [13] Call read y$10_@1.push(read props$8.p4)
  [14] Const mutate t8$23_@4 = JSX <read Component$0 data={read y$10_@1:TPrimitive} >{read child$19_@3}</read Component$0>
  [15] Return read t8$23_@4
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @1 [1:12] deps=[read props$8.p0, read props$8.p2, read props$8.p3] out=[x$9_@1] {
    [1] Const mutate x$9_@1:TFunction[1:12] = Array []
    [2] Let mutate y$10_@1:TPrimitive[1:12] = undefined
    [3] Const mutate $11:TPrimitive = false
    [4] Const mutate $12:TPrimitive = true
    switch (read props$8.p0) {
      case read $12:TPrimitive: {
          [6] Call mutate x$9_@1.push(read props$8.p2)
          [7] Call mutate x$9_@1.push(read props$8.p3)
          scope @2 [8:9] deps=[] out=[] {
            [8] Const mutate y$13_@2 = Array []
          }
      }
      case read $11:TPrimitive: {
          [10] Reassign mutate y$10_@1:TPrimitive[1:12] = read x$9_@1:TFunction
      }
    }
  }
  scope @3 [12:13] deps=[freeze x$9_@1:TFunction] out=[child$19_@3] {
    [12] Const mutate child$19_@3 = JSX <read Component$0 data={freeze x$9_@1:TFunction} ></read Component$0>
  }
  [13] Call read y$10_@1.push(read props$8.p4)
  scope @4 [14:15] deps=[read y$10_@1:TPrimitive, read child$19_@3] out=[$23_@4] {
    [14] Const mutate $23_@4 = JSX <read Component$0 data={read y$10_@1:TPrimitive} >{read child$19_@3}</read Component$0>
  }
  return read $23_@4
}

```

## Code

```javascript
function Component$0(props$8) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props$8.p0;
  const c_1 = $[1] !== props$8.p2;
  const c_2 = $[2] !== props$8.p3;
  let x$9;
  if (c_0 || c_1 || c_2) {
    x$9 = [];
    let y$10 = undefined;

    switch (props$8.p0) {
      case true: {
        x$9.push(props$8.p2);
        x$9.push(props$8.p3);

        if (true) {
          const y$13 = [];
        } else {
        }
      }

      case false: {
        y$10 = x$9;
      }
    }

    $[0] = props$8.p0;
    $[1] = props$8.p2;
    $[2] = props$8.p3;
    $[3] = x$9;
  } else {
    x$9 = $[3];
  }

  const c_4 = $[4] !== x$9;
  let child$19;

  if (c_4) {
    child$19 = <Component$0 data={x$9}></Component$0>;
    $[4] = x$9;
    $[5] = child$19;
  } else {
    child$19 = $[5];
  }

  y$10.push(props$8.p4);
  const c_6 = $[6] !== y$10;
  const c_7 = $[7] !== child$19;
  let t8$23;

  if (c_6 || c_7) {
    t8$23 = <Component$0 data={y$10}>{child$19}</Component$0>;
    $[6] = y$10;
    $[7] = child$19;
    $[8] = t8$23;
  } else {
    t8$23 = $[8];
  }

  return t8$23;
}

```
      