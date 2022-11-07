
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
  [1] Let mutate x$9[1:6] = Array []
  [2] Let mutate y$10 = undefined
  [3] Const mutate $11 = false
  [4] Const mutate $12 = true
  Switch (read props$8.p0)
    Case read $12: bb4
    Case read $11: bb2
    Default: bb1
bb4:
  predecessor blocks: bb0
  [5] Call mutate x$9.push(read props$8.p2)
  [6] Call mutate x$9.push(read props$8.p3)
  [7] Reassign mutate y$13 = Array []
  Goto bb2
bb2:
  predecessor blocks: bb4 bb0
  [8] Reassign mutate y$15 = read x$9
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  y$20: phi(bb2: y$15, bb0: y$10)
  [9] Const mutate child$19 = JSX <read Component$0 data={freeze x$9} ></read Component$0>
  [10] Call read y$20.push(read props$8.p4)
  [11] Const mutate $23 = JSX <read Component$0 data={read y$20} >{read child$19}</read Component$0>
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
      y$15 = x$9;
      ("<<TODO: handle complex control flow in codegen>>");
    }
  }

  const child$19 = <Component$0 data={x$9}></Component$0>;
  y$20.push(props$8.p4);
  return <Component$0 data={y$20}>{child$19}</Component$0>;
}

```
      