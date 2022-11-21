
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
  [1] Let mutate x$2_@0[1:11] = Array []
  [2] Let mutate y$3_@0[1:11] = undefined
  [3] Const mutate $4_@1 = false
  [4] Const mutate $5_@2 = true
  [5] Const mutate $6_@3 = 1
  [6] Switch (read props$1.p0)
    Case read $6_@3: bb1
    Case read $5_@2: bb6
    Default: bb1
    Case read $4_@1: bb2
bb6:
  predecessor blocks: bb0
  [7] Call mutate x$2_@0.push(read props$1.p2)
  [8] Reassign mutate y$3_@0[1:11] = Array []
  [9] Goto bb1
bb2:
  predecessor blocks: bb0
  [10] Reassign mutate y$3_@0[1:11] = read x$2_@0
  [11] Goto bb1
bb1:
  predecessor blocks: bb0 bb6 bb2
  [12] Const mutate child$7_@4 = JSX <read Component$0 data={freeze x$2_@0} ></read Component$0>
  [13] Call read y$3_@0.push(read props$1.p4)
  [14] Const mutate $8_@5 = JSX <read Component$0 data={freeze y$3_@0} >{read child$7_@4}</read Component$0>
  [15] Return read $8_@5
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$2_@0[1:11] = Array []
      [2] Let mutate y$3_@0[1:11] = undefined
      [3] Const mutate $4_@1 = false
      [4] Const mutate $5_@2 = true
      [5] Const mutate $6_@3 = 1
    "]
    bb0_instrs --> bb0_terminal(["Switch (read props$1.p0)"])
  end
  subgraph bb6
    bb6_instrs["
      [7] Call mutate x$2_@0.push(read props$1.p2)
      [8] Reassign mutate y$3_@0[1:11] = Array []
    "]
    bb6_instrs --> bb6_terminal(["Goto"])
  end
  subgraph bb2
    bb2_instrs["
      [10] Reassign mutate y$3_@0[1:11] = read x$2_@0
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [12] Const mutate child$7_@4 = JSX <read Component$0 data={freeze x$2_@0} ></read Component$0>
      [13] Call read y$3_@0.push(read props$1.p4)
      [14] Const mutate $8_@5 = JSX <read Component$0 data={freeze y$3_@0} >{read child$7_@4}</read Component$0>
    "]
    bb1_instrs --> bb1_terminal(["Return read $8_@5"])
  end

  %% Jumps
  bb0_terminal -- "read $6_@3" --> bb1
  bb0_terminal -- "read $5_@2" --> bb6
  bb0_terminal -- "default" --> bb1
  bb0_terminal -- "read $4_@1" --> bb2
  bb0_terminal -- "fallthrough" --> bb1
  bb6_terminal --> bb1
  bb2_terminal --> bb1

```

## Code

```javascript
function Component$0(props$1) {
  let x$2 = [];
  let y$3 = undefined;
  bb1: switch (props$1.p0) {
    case 1: {
      break bb1;
    }

    case true: {
      x$2.push(props$1.p2);
      y$3 = [];
      break bb1;
    }

    default: {
      break bb1;
    }

    case false: {
      y$3 = x$2;
    }
  }

  const child$7 = <Component$0 data={x$2}></Component$0>;
  y$3.push(props$1.p4);
  return <Component$0 data={y$3}>{child$7}</Component$0>;
}

```
      