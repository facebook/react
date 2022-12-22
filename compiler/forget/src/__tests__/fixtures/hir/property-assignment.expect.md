
## Input

```javascript
function Component(props) {
  const x = {};
  const y = [];
  x.y = y;
  const child = <Component data={y} />;
  x.y.push(props.p0);
  return <Component data={x}>{child}</Component>;
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0:TObject[1:6] = Object {  }
  [2] Const mutate y$8_@0[1:6] = Array []
  [3] Reassign store x$7_@0.y[1:6] = read y$8_@0
  [4] Const mutate child$9_@0[1:6] = JSX <read Component$0 data={freeze y$8_@0} ></read Component$0>
  [5] Call mutate x$7_@0.y.push(read props$6.p0)
  [6] Const mutate t5$10_@1 = JSX <read Component$0 data={freeze x$7_@0:TObject} >{read child$9_@0}</read Component$0>
  [7] Return read t5$10_@1
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:6] deps=[read props$6.p0] out=[x$7_@0, child$9_@0] {
    [1] Const mutate x$7_@0:TObject[1:6] = Object {  }
    [2] Const mutate y$8_@0[1:6] = Array []
    [3] Reassign store x$7_@0.y[1:6] = read y$8_@0
    [4] Const mutate child$9_@0[1:6] = JSX <read Component$0 data={freeze y$8_@0} ></read Component$0>
    [5] Call mutate x$7_@0.y.push(read props$6.p0)
  }
  scope @1 [6:7] deps=[freeze x$7_@0:TObject, read child$9_@0] out=[$10_@1] {
    [6] Const mutate $10_@1 = JSX <read Component$0 data={freeze x$7_@0:TObject} >{read child$9_@0}</read Component$0>
  }
  return read $10_@1
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  let x;
  let child;
  if (c_0) {
    x = {};
    const y = [];
    x.y = y;
    child = <Component data={y}></Component>;
    x.y.push(props.p0);
    $[0] = props.p0;
    $[1] = x;
    $[2] = child;
  } else {
    x = $[1];
    child = $[2];
  }

  const c_3 = $[3] !== x;
  const c_4 = $[4] !== child;
  let t5;

  if (c_3 || c_4) {
    t5 = <Component data={x}>{child}</Component>;
    $[3] = x;
    $[4] = child;
    $[5] = t5;
  } else {
    t5 = $[5];
  }

  return t5;
}

```
      