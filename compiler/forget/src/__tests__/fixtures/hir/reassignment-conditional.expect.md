
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
  [1] Let mutate x$7[1:2] = Array []
  [2] Call mutate x$7.push(read props$6.p0)
  [3] Let mutate y$8 = read x$7
  If (read props$6.p1) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [4] Reassign mutate x$9 = Array []
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  x$11: phi(bb2: x$9, bb0: x$7)
  [5] Let mutate _$12 = JSX <read Component$0 x={freeze x$11} ></read Component$0>
  [6] Call read y$8.push(read props$6.p2)
  [7] Const mutate $15 = JSX <read Component$0 x={read x$11} y={read y$8} ></read Component$0>
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

  let _$12 = <Component$0 x={x$11}></Component$0>;

  y$8.push(props$6.p2);
  return <Component$0 x={x$11} y={y$8}></Component$0>;
}

```
      