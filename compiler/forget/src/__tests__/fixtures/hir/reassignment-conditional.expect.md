
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
  Let readonly x$2 = Array []
  Call mutable x$2.push(frozen props$1.p0)
  Let readonly y$3 = readonly x$2
  If (frozen props$1.p1) then:bb2 else:bb1
bb2:
  Reassign readonly x$2 = Array []
  Goto bb1
bb1:
  Let readonly _$4 = JSX <frozen Component$0 x={frozen x$2} ></frozen Component$0>
  Call mutable y$3.push(frozen props$1.p2)
  Const readonly $5 = JSX <frozen Component$0 x={frozen x$2} y={frozen y$3} ></frozen Component$0>
  Return frozen $5
```

## Code

```javascript
function Component$0(props$1) {
  let x$2 = [];
  x$2.push(props$1.p0);
  let y$3 = x$2;
  if (props$1.p1) {
    x$2 = [];
    ("<<TODO: handle complex control flow in codegen>>");
  }
  let _$4 = <Component$0 x={x$2}></Component$0>;
  y$3.push(props$1.p2);
  return <Component$0 x={x$2} y={y$3}></Component$0>;
}

```
      