
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
  readonly x$2 = Array []
  readonly y$3 = undefined
  readonly $4 = false
  readonly $5 = true
  Switch (frozen props$1.p0)
    Case readonly $5: bb4
    Case readonly $4: bb2
    Default: bb1
bb4:
  Call mutable x$2.push(frozen props$1.p2)
  Call mutable x$2.push(frozen props$1.p3)
  readonly y$3 = Array []
  Goto bb2
bb2:
  readonly y$3 = readonly x$2
  Goto bb1
bb1:
  readonly child$6 = JSX <frozen Component$0 data={frozen x$2} ></frozen Component$0>
  Call mutable y$3.push(frozen props$1.p4)
  readonly $7 = JSX <frozen Component$0 data={frozen y$3} >{frozen child$6}</frozen Component$0>
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
      