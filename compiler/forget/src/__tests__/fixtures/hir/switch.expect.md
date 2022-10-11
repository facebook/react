
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
  Let readonly x$2 = Array []
  Let readonly y$3 = undefined
  Const readonly $4 = false
  Const readonly $5 = true
  Switch (frozen props$1.p0)
    Case readonly $5: bb4
    Case readonly $4: bb2
    Default: bb1
bb4:
  Call mutable x$2.push(frozen props$1.p2)
  Call mutable x$2.push(frozen props$1.p3)
  Reassign readonly y$3 = Array []
  Goto bb2
bb2:
  Reassign readonly y$3 = readonly x$2
  Goto bb1
bb1:
  Const readonly child$6 = JSX <frozen Component$0 data={frozen x$2} ></frozen Component$0>
  Call mutable y$3.push(frozen props$1.p4)
  Const readonly $7 = JSX <frozen Component$0 data={frozen y$3} >{frozen child$6}</frozen Component$0>
  Return frozen $7
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
      