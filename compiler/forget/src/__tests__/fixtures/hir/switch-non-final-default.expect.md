
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  switch (props.p0) {
    case 1: {
      break;
    }
    case true: {
      x.push(props.p2);
      y = [];
    }
    default: {
      break;
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
  Const mutable $6 = 1
  Switch (<unknown> props$1.p0)
    Case readonly $6: bb1
    Case readonly $5: bb6
    Default: bb1
    Case readonly $4: bb2
bb1:
  Const mutable child$7 = JSX <readonly Component$0 data={freeze x$2} ></readonly Component$0>
  Call readonly y$3.push(readonly props$1.p4)
  Const mutable $8 = JSX <readonly Component$0 data={freeze y$3} >{readonly child$7}</readonly Component$0>
  Return readonly $8
bb6:
  Call mutable x$2.push(readonly props$1.p2)
  Reassign mutable y$3 = Array []
  Goto bb1
bb2:
  Reassign mutable y$3 = readonly x$2
  Goto bb1
```

## Code

```javascript
function Component$0(props$1) {
  let x$2 = [];
  let y$3 = undefined;
  switch (props$1.p0) {
    case 1:
      break;
    case true: {
      x$2.push(props$1.p2);
      y$3 = [];
      ("<<TODO: handle complex control flow in codegen>>");
    }
    default:
      break;
    case false: {
      y$3 = x$2;
      ("<<TODO: handle complex control flow in codegen>>");
    }
  }
  const child$7 = <Component$0 data={x$2}></Component$0>;
  y$3.push(props$1.p4);
  return <Component$0 data={y$3}>{child$7}</Component$0>;
}

```
      