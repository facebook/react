
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  let y = [];
  while (c) {
    y.push(b);
    x.push(a);
  }
}

```

## HIR

```
bb0:
  [1] Let mutate x$9_@0[1:8] = Array []
  [2] Let mutate y$10_@0[1:8] = Array []
  [3] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb3
  [4] If (read c$8) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [5] Call mutate y$10_@0.push(read b$7)
  [6] Call mutate x$9_@0.push(read a$6)
  [7] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [8] Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$9_@0[1:8] = Array []
      [2] Let mutate y$10_@0[1:8] = Array []
    "]
    bb0_instrs --> bb0_terminal(["While"])
  end
  subgraph bb1
    bb1_terminal(["If (read c$8)"])
  end
  subgraph bb3
    bb3_instrs["
      [5] Call mutate y$10_@0.push(read b$7)
      [6] Call mutate x$9_@0.push(read a$6)
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- "test" --> bb1
  bb0_terminal -- "loop" --> bb3
  bb0_terminal -- "fallthrough" --> bb2
  bb1_terminal -- "then" --> bb3
  bb1_terminal -- "else" --> bb2
  bb3_terminal --> bb1

```

## Code

```javascript
function foo$0(a$1, b$2, c$3) {
  let x$4 = [];
  let y$5 = [];
  bb2: while (c$3) {
    y$5.push(b$2);
    x$4.push(a$1);
  }
}

```
      