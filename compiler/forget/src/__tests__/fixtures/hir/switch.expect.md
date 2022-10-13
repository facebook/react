
## Input

```javascript
// @Out DefUseGraph
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
  Let mutate x$2 = Array []
  Let mutate y$3 = undefined
  Const mutate $4 = false
  Const mutate $5 = true
  Switch (<unknown> props$1.p0)
    Case read $5: bb4
    Case read $4: bb2
    Default: bb1
bb4:
  Call mutate x$2.push(read props$1.p2)
  Call mutate x$2.push(read props$1.p3)
  Reassign mutate y$3 = Array []
  Goto bb2
bb2:
  Reassign mutate y$3 = read x$2
  Goto bb1
bb1:
  Const mutate child$6 = JSX <read Component$0 data={freeze x$2} ></read Component$0>
  Call read y$3.push(read props$1.p4)
  Const mutate $7 = JSX <read Component$0 data={read y$3} >{read child$6}</read Component$0>
  Return read $7
```

## Code

```javascript
function Component$0(props$1) {
  let x$2 = [];
  let y$3 = undefined;
  switch (props$1.p0) {
    case true: {
      x$2.push(props$1.p2);
      x$2.push(props$1.p3);
      y$3 = [];
      ("<<TODO: handle complex control flow in codegen>>");
    }
    case false: {
      y$3 = x$2;
      ("<<TODO: handle complex control flow in codegen>>");
    }
  }
  const child$6 = <Component$0 data={x$2}></Component$0>;
  y$3.push(props$1.p4);
  return <Component$0 data={y$3}>{child$6}</Component$0>;
}

```
      