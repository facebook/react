
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
  [4] Let mutate x$11_@1[1:7] = read x$7_@0
  [4] If (read props$6.p1) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate x$9_@2 = Array []
  [6] Reassign mutate x$11_@1[1:7] = read x$9_@2
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Const mutate _$12_@3 = JSX <read Component$0 x={freeze x$11_@1} ></read Component$0>
  [8] Call read y$8.push(read props$6.p2)
  [9] Const mutate t7$15_@4 = JSX <read Component$0 x={read x$11_@1} y={read y$8} ></read Component$0>
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
  scope @1 [1:7] deps=[read props$6.p1] out=[x$11_@1] {
    [4] Let mutate x$11_@1[1:7] = read x$7_@0
    if (read props$6.p1) {
      scope @2 [5:6] deps=[] out=[x$9_@2] {
        [5] Const mutate x$9_@2 = Array []
      }
      [6] Reassign mutate x$11_@1[1:7] = read x$9_@2
    }
  }
  [7] Const mutate _$12_@3 = JSX <read Component$0 x={freeze x$11_@1} ></read Component$0>
  [8] Call read y$8.push(read props$6.p2)
  scope @4 [9:10] deps=[read x$11_@1, read y$8] out=[$15_@4] {
    [9] Const mutate $15_@4 = JSX <read Component$0 x={read x$11_@1} y={read y$8} ></read Component$0>
  }
  return read $15_@4
}

```

## Code

```javascript
function Component$0(props$6) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props$6.p0;
  let x$7;
  if (c_0) {
    x$7 = [];
    x$7.push(props$6.p0);
    $[0] = props$6.p0;
    $[1] = x$7;
  } else {
    x$7 = $[1];
  }

  const y$8 = x$7;
  const c_2 = $[2] !== props$6.p1;
  let x$11;

  if (c_2) {
    x$11 = x$7;

    if (props$6.p1) {
      let x$9;

      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        x$9 = [];
        $[4] = x$9;
      } else {
        x$9 = $[4];
      }

      x$11 = x$9;
    }

    $[2] = props$6.p1;
    $[3] = x$11;
  } else {
    x$11 = $[3];
  }

  const _$12 = <Component$0 x={x$11}></Component$0>;

  y$8.push(props$6.p2);
  const c_5 = $[5] !== x$11;
  const c_6 = $[6] !== y$8;
  let t7$15;

  if (c_5 || c_6) {
    t7$15 = <Component$0 x={x$11} y={y$8}></Component$0>;
    $[5] = x$11;
    $[6] = y$8;
    $[7] = t7$15;
  } else {
    t7$15 = $[7];
  }

  return t7$15;
}

```
      