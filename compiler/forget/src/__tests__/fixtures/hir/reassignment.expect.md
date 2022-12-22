
## Input

```javascript
function Component(props) {
  let x = [];
  x.push(props.p0);
  let y = x;

  x = [];
  let _ = <Component x={x} />;

  y.push(props.p1);

  return <Component x={x} y={y} />;
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0[1:7] = Array []
  [2] Call mutate x$7_@0.push(read props$6.p0)
  [3] Const mutate y$8_@0[1:7] = read x$7_@0
  [4] Const mutate x$0$9_@1 = Array []
  [5] Const mutate _$10_@2 = JSX <read Component$0 x={freeze x$0$9_@1} ></read Component$0>
  [6] Call mutate y$8_@0.push(read props$6.p1)
  [7] Const mutate t6$11_@3 = JSX <read Component$0 x={read x$0$9_@1} y={freeze y$8_@0} ></read Component$0>
  [8] Return read t6$11_@3
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:7] deps=[read props$6.p0, read props$6.p1] out=[y$8_@0] {
    [1] Const mutate x$7_@0[1:7] = Array []
    [2] Call mutate x$7_@0.push(read props$6.p0)
    [3] Const mutate y$8_@0[1:7] = read x$7_@0
    scope @1 [4:5] deps=[] out=[x$0$9_@1] {
      [4] Const mutate x$0$9_@1 = Array []
    }
    [5] Const mutate _$10_@2 = JSX <read Component$0 x={freeze x$0$9_@1} ></read Component$0>
    [6] Call mutate y$8_@0.push(read props$6.p1)
  }
  scope @3 [7:8] deps=[read x$0$9_@1, freeze y$8_@0] out=[$11_@3] {
    [7] Const mutate $11_@3 = JSX <read Component$0 x={read x$0$9_@1} y={freeze y$8_@0} ></read Component$0>
  }
  return read $11_@3
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  let y;
  if (c_0 || c_1) {
    const x = [];
    x.push(props.p0);
    y = x;
    let x$0;

    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      x$0 = [];
      $[3] = x$0;
    } else {
      x$0 = $[3];
    }

    const _ = <Component x={x$0}></Component>;

    y.push(props.p1);
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = y;
  } else {
    y = $[2];
  }

  const c_4 = $[4] !== x$0;
  const c_5 = $[5] !== y;
  let t6;

  if (c_4 || c_5) {
    t6 = <Component x={x$0} y={y}></Component>;
    $[4] = x$0;
    $[5] = y;
    $[6] = t6;
  } else {
    t6 = $[6];
  }

  return t6;
}

```
      