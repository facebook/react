
## Input

```javascript
function Component(props) {
  let x = [];
  x.push(props.p0);
  let y = x;

  x = [];
  let _ = <Component x={x} />;

  y.push(props.p1);

  return <Component x={x} y={y} />;
}

```

## HIR

```
bb0:
  mutable x$2 = Array []
  Call mutable x$2.push(frozen props$1.p0)
  mutable y$3 = mutable x$2
  frozen x$2 = Array []
  frozen _$4 = JSX <frozen Component$0 x={frozen x$2} ></frozen Component$0>
  Call mutable y$3.push(frozen props$1.p1)
  frozen $5 = JSX <frozen Component$0 x={frozen x$2} y={readonly y$3} ></frozen Component$0>
  Return frozen $5
```

## Code

```javascript
function Component$0(props$1) {
  x$2 = [];
  x$2.push(props$1.p0);
  y$3 = x$2;
  x$2 = [];
  _$4 = <Component$0 x={x$2}></Component$0>;
  y$3.push(props$1.p1);
  return <Component$0 x={x$2} y={y$3}></Component$0>;
}

```
      