
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
  [4] Const mutate x$9_@1 = Array []
  [5] Const mutate _$10_@2 = JSX <read Component$0 x={freeze x$9_@1} ></read Component$0>
  [6] Call mutate y$8_@0.push(read props$6.p1)
  [7] Const mutate t6$11_@3 = JSX <read Component$0 x={read x$9_@1} y={freeze y$8_@0} ></read Component$0>
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
    scope @1 [4:5] deps=[] out=[x$9_@1] {
      [4] Const mutate x$9_@1 = Array []
    }
    [5] Const mutate _$10_@2 = JSX <read Component$0 x={freeze x$9_@1} ></read Component$0>
    [6] Call mutate y$8_@0.push(read props$6.p1)
  }
  scope @3 [7:8] deps=[read x$9_@1, freeze y$8_@0] out=[$11_@3] {
    [7] Const mutate $11_@3 = JSX <read Component$0 x={read x$9_@1} y={freeze y$8_@0} ></read Component$0>
  }
  return read $11_@3
}

```

## Code

```javascript
function Component$0(props$6) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props$6.p0;
  const c_1 = $[1] !== props$6.p1;
  let y$8;
  if (c_0 || c_1) {
    const x$7 = [];
    x$7.push(props$6.p0);
    y$8 = x$7;
    let x$9;

    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      x$9 = [];
      $[3] = x$9;
    } else {
      x$9 = $[3];
    }

    const _$10 = <Component$0 x={x$9}></Component$0>;

    y$8.push(props$6.p1);
    $[0] = props$6.p0;
    $[1] = props$6.p1;
    $[2] = y$8;
  } else {
    y$8 = $[2];
  }

  const c_4 = $[4] !== x$9;
  const c_5 = $[5] !== y$8;
  let t6$11;

  if (c_4 || c_5) {
    t6$11 = <Component$0 x={x$9} y={y$8}></Component$0>;
    $[4] = x$9;
    $[5] = y$8;
    $[6] = t6$11;
  } else {
    t6$11 = $[6];
  }

  return t6$11;
}

```
      