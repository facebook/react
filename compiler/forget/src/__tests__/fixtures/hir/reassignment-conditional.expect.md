
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
  [1] Let mutate x$7_@0:TFunction[1:7] = Array []
  [2] Call mutate x$7_@0.push(read props$6.p0)
  [3] Const mutate y$8:TFunction = read x$7_@0:TFunction
  [4] If (read props$6.p1) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$7_@0:TFunction[1:7] = Array []
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Const mutate _$12_@1 = JSX <read Component$0 x={freeze x$7_@0:TFunction} ></read Component$0>
  [8] Call read y$8.push(read props$6.p2)
  [9] Const mutate t6$15_@2 = JSX <read Component$0 x={read x$7_@0:TFunction} y={read y$8:TFunction} ></read Component$0>
  [10] Return read t6$15_@2
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:7] deps=[read props$6.p0, read props$6.p1] out=[x$7_@0] {
    [1] Let mutate x$7_@0:TFunction[1:7] = Array []
    [2] Call mutate x$7_@0.push(read props$6.p0)
    [3] Const mutate y$8:TFunction = read x$7_@0:TFunction
    if (read props$6.p1) {
      [5] Reassign mutate x$7_@0:TFunction[1:7] = Array []
    }
  }
  scope @1 [7:8] deps=[freeze x$7_@0:TFunction] out=[] {
    [7] Const mutate _$12_@1 = JSX <read Component$0 x={freeze x$7_@0:TFunction} ></read Component$0>
  }
  [8] Call read y$8.push(read props$6.p2)
  scope @2 [9:10] deps=[read x$7_@0:TFunction, read y$8:TFunction] out=[$15_@2] {
    [9] Const mutate $15_@2 = JSX <read Component$0 x={read x$7_@0:TFunction} y={read y$8:TFunction} ></read Component$0>
  }
  return read $15_@2
}

```

## Code

```javascript
function Component$0(props$6) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props$6.p0;
  const c_1 = $[1] !== props$6.p1;
  let x$7;
  if (c_0 || c_1) {
    x$7 = [];
    x$7.push(props$6.p0);
    const y$8 = x$7;

    if (props$6.p1) {
      x$7 = [];
    }

    $[0] = props$6.p0;
    $[1] = props$6.p1;
    $[2] = x$7;
  } else {
    x$7 = $[2];
  }

  const c_3 = $[3] !== x$7;

  if (c_3) {
    const _$12 = <Component$0 x={x$7}></Component$0>;

    $[3] = x$7;
  } else {
  }

  y$8.push(props$6.p2);
  const c_4 = $[4] !== x$7;
  const c_5 = $[5] !== y$8;
  let t6$15;

  if (c_4 || c_5) {
    t6$15 = <Component$0 x={x$7} y={y$8}></Component$0>;
    $[4] = x$7;
    $[5] = y$8;
    $[6] = t6$15;
  } else {
    t6$15 = $[6];
  }

  return t6$15;
}

```
      