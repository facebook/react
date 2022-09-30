
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  switch (props.p0) {
    case true: {
      x.push(props.p2);
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
  mutable x$2 = Array []
  frozen y$3 = undefined
  frozen $4 = false
  frozen $5 = true
  Switch (frozen props$1.p0)
    Case frozen $5: bb4
    Case frozen $4: bb2
    Default: bb1
bb4:
  Call mutable x$2.push(frozen props$1.p2)
  frozen y$3 = Array []
  Goto bb2
bb2:
  mutable y$3 = mutable x$2
  Goto bb1
bb1:
  frozen child$6 = JSX <frozen Component$0 data={readonly x$2} ></frozen Component$0>
  Call frozen y$3.push(frozen props$1.p4)
  frozen $7 = JSX <frozen Component$0 data={frozen y$3} >{frozen child$6}</frozen Component$0>
  Return frozen $7
```

## Code

```javascript
function Component$0(props$1) {
  x$2 = [];
  y$3 = undefined;
  ("<<TODO: handle switch in codegen>>");
}

```
      