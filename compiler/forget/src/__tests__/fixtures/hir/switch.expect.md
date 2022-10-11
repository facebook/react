
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
  Let mutable x$2 = Array []
  Let mutable y$3 = undefined
  Const mutable $4 = false
  Const mutable $5 = true
  Switch (<unknown> props$1.p0)
    Case readonly $5: bb4
    Case readonly $4: bb2
    Default: bb1
bb4:
  Call mutable x$2.push(readonly props$1.p2)
  Call mutable x$2.push(readonly props$1.p3)
  Reassign mutable y$3 = Array []
  Goto bb2
bb2:
  Reassign mutable y$3 = readonly x$2
  Goto bb1
bb1:
  Const mutable child$6 = JSX <readonly Component$0 data={freeze x$2} ></readonly Component$0>
  Call readonly y$3.push(readonly props$1.p4)
  Const mutable $7 = JSX <readonly Component$0 data={readonly y$3} >{readonly child$6}</readonly Component$0>
  Return readonly $7
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
      