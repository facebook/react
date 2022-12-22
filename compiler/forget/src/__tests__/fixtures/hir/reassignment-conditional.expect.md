
## Input

```javascript
function Component(props) {
  let x = [];
  x.push(props.p0);
  let y = x;

  if (props.p1) {
    x = [];
  }

  let _ = <Component x={x} />;
  y.push(props.p2);

  return <Component x={x} y={y} />;
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0[1:3] = Array []
  [2] Call mutate x$7_@0.push(read props$6.p0)
  [3] Const mutate y$8 = read x$7_@0
  [4] Let mutate x$0$11_@1[1:7] = read x$7_@0
  [4] If (read props$6.p1) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate x$1$9_@2 = Array []
  [6] Reassign mutate x$0$11_@1[1:7] = read x$1$9_@2
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Const mutate _$12_@3 = JSX <read Component$0 x={freeze x$0$11_@1} ></read Component$0>
  [8] Call read y$8.push(read props$6.p2)
  [9] Const mutate t7$15_@4 = JSX <read Component$0 x={read x$0$11_@1} y={read y$8} ></read Component$0>
  [10] Return read t7$15_@4
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:3] deps=[read props$6.p0] out=[x$7_@0] {
    [1] Const mutate x$7_@0[1:3] = Array []
    [2] Call mutate x$7_@0.push(read props$6.p0)
  }
  [3] Const mutate y$8 = read x$7_@0
  scope @1 [1:7] deps=[read props$6.p1] out=[x$0$11_@1] {
    [4] Let mutate x$0$11_@1[1:7] = read x$7_@0
    if (read props$6.p1) {
      scope @2 [5:6] deps=[] out=[x$1$9_@2] {
        [5] Const mutate x$1$9_@2 = Array []
      }
      [6] Reassign mutate x$0$11_@1[1:7] = read x$1$9_@2
    }
  }
  [7] Const mutate _$12_@3 = JSX <read Component$0 x={freeze x$0$11_@1} ></read Component$0>
  [8] Call read y$8.push(read props$6.p2)
  scope @4 [9:10] deps=[read x$0$11_@1, read y$8] out=[$15_@4] {
    [9] Const mutate $15_@4 = JSX <read Component$0 x={read x$0$11_@1} y={read y$8} ></read Component$0>
  }
  return read $15_@4
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  let x;
  if (c_0) {
    x = [];
    x.push(props.p0);
    $[0] = props.p0;
    $[1] = x;
  } else {
    x = $[1];
  }

  const y = x;
  const c_2 = $[2] !== props.p1;
  let x$0;

  if (c_2) {
    x$0 = x;

    if (props.p1) {
      let x$1;

      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        x$1 = [];
        $[4] = x$1;
      } else {
        x$1 = $[4];
      }

      x$0 = x$1;
    }

    $[2] = props.p1;
    $[3] = x$0;
  } else {
    x$0 = $[3];
  }

  const _ = <Component x={x$0}></Component>;

  y.push(props.p2);
  const c_5 = $[5] !== x$0;
  const c_6 = $[6] !== y;
  let t7;

  if (c_5 || c_6) {
    t7 = <Component x={x$0} y={y}></Component>;
    $[5] = x$0;
    $[6] = y;
    $[7] = t7;
  } else {
    t7 = $[7];
  }

  return t7;
}

```
      