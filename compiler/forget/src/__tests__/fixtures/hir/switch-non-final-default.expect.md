
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
  readonly x$2 = Array []
  readonly y$3 = undefined
  readonly $4 = false
  readonly $5 = true
  readonly $6 = 1
  Switch (frozen props$1.p0)
    Case readonly $6: bb1
    Case readonly $5: bb6
    Default: bb1
    Case readonly $4: bb2
bb1:
  readonly child$7 = JSX <frozen Component$0 data={frozen x$2} ></frozen Component$0>
  Call mutable y$3.push(frozen props$1.p4)
  readonly $8 = JSX <frozen Component$0 data={frozen y$3} >{frozen child$7}</frozen Component$0>
  Return frozen $8
bb6:
  Call mutable x$2.push(frozen props$1.p2)
  readonly y$3 = Array []
  Goto bb1
bb2:
  readonly y$3 = readonly x$2
  Goto bb1
```

## Code

```javascript
function Component$0(props$1) {
  x$2 = [];
  y$3 = undefined;
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

  child$7 = <Component$0 data={x$2}></Component$0>;
  y$3.push(props$1.p4);
  return <Component$0 data={y$3}>{child$7}</Component$0>;
}

```
      