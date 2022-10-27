
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
  Let mutate x$9 = Array []
  Let mutate y$10 = undefined
  Const mutate $11 = false
  Const mutate $12 = true
  Switch (<unknown> props$8.p0)
    Case read $12: bb4
    Case read $11: bb2
    Default: bb1
bb4:
  predecessor blocks: bb0
  Call mutate x$9.push(read props$8.p2)
  Call mutate x$9.push(read props$8.p3)
  Reassign mutate y$13 = Array []
  Goto bb2
bb2:
  predecessor blocks: bb4 bb0
  x$14: phi(bb4: x$9, bb0: x$9)
  Component$17: phi(bb4: Component$0, bb0: Component$0)
  props$22: phi(bb4: props$8, bb0: props$8)
  Reassign mutate y$15 = read x$14
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  Component$16: phi(bb2: Component$17, bb0: Component$0)
  x$18: phi(bb2: x$14, bb0: x$9)
  y$20: phi(bb2: y$15, bb0: y$10)
  props$21: phi(bb2: props$22, bb0: props$8)
  Const mutate child$19 = JSX <read Component$16 data={freeze x$18} ></read Component$16>
  Call read y$20.push(read props$21.p4)
  Const mutate $23 = JSX <read Component$16 data={read y$20} >{read child$19}</read Component$16>
  Return read $23
```

## Code

```javascript
function Component$0(props$8) {
  let x$9 = [];
  let y$10 = undefined;
  switch (props$8.p0) {
    case true: {
      x$9.push(props$8.p2);
      x$9.push(props$8.p3);
      y$13 = [];
      ("<<TODO: handle complex control flow in codegen>>");
    }

    case false: {
      y$15 = x$14;
      ("<<TODO: handle complex control flow in codegen>>");
    }
  }

  const child$19 = <Component$16 data={x$18}></Component$16>;
  y$20.push(props$21.p4);
  return <Component$16 data={y$20}>{child$19}</Component$16>;
}

```
      