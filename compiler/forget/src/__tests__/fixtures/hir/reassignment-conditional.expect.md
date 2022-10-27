
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
  Let mutate x$7 = Array []
  Call mutate x$7.push(read props$6.p0)
  Let mutate y$8 = read x$7
  If (read props$6.p1) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Reassign mutate x$9 = Array []
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Component$10: phi(bb0: Component$0, bb2: Component$0)
  x$11: phi(bb0: x$7, bb2: x$9)
  y$13: phi(bb0: y$8, bb2: y$8)
  props$14: phi(bb0: props$6, bb2: props$6)
  Let mutate _$12 = JSX <read Component$10 x={freeze x$11} ></read Component$10>
  Call read y$13.push(read props$14.p2)
  Const mutate $15 = JSX <read Component$10 x={read x$11} y={read y$13} ></read Component$10>
  Return read $15
```

## Code

```javascript
function Component$0(props$6) {
  let x$7 = [];
  x$7.push(props$6.p0);
  let y$8 = x$7;
  if (props$6.p1) {
    x$9 = [];
    ("<<TODO: handle complex control flow in codegen>>");
  }

  let _$12 = <Component$10 x={x$11}></Component$10>;

  y$13.push(props$14.p2);
  return <Component$10 x={x$11} y={y$13}></Component$10>;
}

```
      