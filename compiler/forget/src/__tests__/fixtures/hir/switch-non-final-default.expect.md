
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
  Let mutate x$10 = Array []
  Let mutate y$11 = undefined
  Const mutate $12 = false
  Const mutate $13 = true
  Const mutate $14 = 1
  Switch (<unknown> props$9.p0)
    Case read $14: bb1
    Case read $13: bb6
    Default: bb1
    Case read $12: bb2
bb6:
  predecessor blocks: bb0
  Call mutate x$10.push(read props$9.p2)
  Reassign mutate y$15 = Array []
  Goto bb1
bb2:
  predecessor blocks: bb0
  Reassign mutate y$16 = read x$10
  Goto bb1
bb1:
  predecessor blocks: bb0 bb6 bb2
  Component$17: phi(bb0: Component$0, bb6: Component$0, bb2: Component$0)
  x$18: phi(bb0: x$10, bb6: x$10, bb2: x$10)
  y$20: phi(bb0: y$11, bb6: y$15, bb2: y$16)
  props$21: phi(bb0: props$9, bb6: props$9, bb2: props$9)
  Const mutate child$19 = JSX <read Component$17 data={freeze x$18} ></read Component$17>
  Call read y$20.push(read props$21.p4)
  Const mutate $22 = JSX <read Component$17 data={freeze y$20} >{read child$19}</read Component$17>
  Return read $22
```

## Code

```javascript
function Component$0(props$9) {
  let x$10 = [];
  let y$11 = undefined;
  switch (props$9.p0) {
    case 1:
      break;

    case true: {
      x$10.push(props$9.p2);
      y$15 = [];
      ("<<TODO: handle complex control flow in codegen>>");
    }

    default:
      break;

    case false: {
      y$16 = x$10;
      ("<<TODO: handle complex control flow in codegen>>");
    }
  }

  const child$19 = <Component$17 data={x$18}></Component$17>;
  y$20.push(props$21.p4);
  return <Component$17 data={y$20}>{child$19}</Component$17>;
}

```
      