
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
  [1] Let mutate x$9_@0[1:12] = Array []
  [2] Let mutate y$10_@0[1:12] = undefined
  [3] Const mutate $11_@1 = false
  [4] Const mutate $12_@2 = true
  [5] Switch (read props$8.p0)
    Case read $12_@2: bb4
    Case read $11_@1: bb2
    Default: bb1
    Fallthrough: bb1
bb4:
  predecessor blocks: bb0
  [6] Call mutate x$9_@0.push(read props$8.p2)
  [7] Call mutate x$9_@0.push(read props$8.p3)
  [8] Reassign mutate y$13_@3 = Array []
  [9] Goto bb2
bb2:
  predecessor blocks: bb4 bb0
  [10] Reassign mutate y$15_@0[1:12] = read x$9_@0
  [11] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  y$20_@0[1:12]: phi(bb2: y$15_@0, bb0: y$10_@0)
  [12] Const mutate child$19_@4 = JSX <read Component$0 data={freeze x$9_@0} ></read Component$0>
  [13] Call read y$20_@0.push(read props$8.p4)
  [14] Const mutate $23_@5 = JSX <read Component$0 data={read y$20_@0} >{read child$19_@4}</read Component$0>
  [15] Return read $23_@5
scope0 [1:12]:
 - read props$8.p2
 - read props$8.p3
 - read props$8.p0
scope4 [12:13]:
 - read Component$0
 - freeze x$9_@0
 - read props$8.p4
scope5 [14:15]:
 - read Component$0
 - read child$19_@4
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$9_@0[1:12] = Array []
      [2] Let mutate y$10_@0[1:12] = undefined
      [3] Const mutate $11_@1 = false
      [4] Const mutate $12_@2 = true
    "]
    bb0_instrs --> bb0_terminal(["Switch (read props$8.p0)"])
  end
  subgraph bb4
    bb4_instrs["
      [6] Call mutate x$9_@0.push(read props$8.p2)
      [7] Call mutate x$9_@0.push(read props$8.p3)
      [8] Reassign mutate y$13_@3 = Array []
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb2
    bb2_instrs["
      [10] Reassign mutate y$15_@0[1:12] = read x$9_@0
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [12] Const mutate child$19_@4 = JSX <read Component$0 data={freeze x$9_@0} ></read Component$0>
      [13] Call read y$20_@0.push(read props$8.p4)
      [14] Const mutate $23_@5 = JSX <read Component$0 data={read y$20_@0} >{read child$19_@4}</read Component$0>
    "]
    bb1_instrs --> bb1_terminal(["Return read $23_@5"])
  end

  %% Jumps
  bb0_terminal -- "read $12_@2" --> bb4
  bb0_terminal -- "read $11_@1" --> bb2
  bb0_terminal -- "default" --> bb1
  bb0_terminal -- "fallthrough" --> bb1
  bb4_terminal --> bb2
  bb2_terminal --> bb1

```

## Code

```javascript
function Component$0(props$8) {
  const x$9 = [];
  let y$10 = undefined;
  bb1: switch (props$8.p0) {
    case true: {
      x$9.push(props$8.p2);
      x$9.push(props$8.p3);
      const y$13 = [];
    }

    case false: {
      y$10 = x$9;
    }
  }

  const child$19 = <Component$0 data={x$9}></Component$0>;
  y$10.push(props$8.p4);
  return <Component$0 data={y$10}>{child$19}</Component$0>;
}

```
      