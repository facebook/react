
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
  Let mutable x$2 = Array []
  Call mutable x$2.push(readonly props$1.p0)
  Let mutable y$3 = readonly x$2
  If (readonly props$1.p1) then:bb2 else:bb1
bb2:
  Reassign mutable x$2 = Array []
  Goto bb1
bb1:
  Let mutable _$4 = JSX <readonly Component$0 x={freeze x$2} ></readonly Component$0>
  Call readonly y$3.push(readonly props$1.p2)
  Const mutable $5 = JSX <readonly Component$0 x={readonly x$2} y={readonly y$3} ></readonly Component$0>
  Return readonly $5
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
      