
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    let y = [];
    if (b) {
      y.push(c);
    }

    x.push(y);
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$9_@0[1:9] = Array []
  [2] If (read a$6) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Let mutate y$10_@0[1:9] = Array []
  [4] If (read b$7) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb2
  [5] Call mutate y$10_@0.push(read c$8)
  [6] Goto bb3
bb3:
  predecessor blocks: bb4 bb2
  [7] Call mutate x$9_@0.push(mutate y$10_@0)
  [8] Goto bb1
bb1:
  predecessor blocks: bb3 bb0
  [9] Return freeze x$9_@0
scope0 [1:9]:
 - read c$8
 - read b$7
 - read a$6
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$9_@0[1:9] = Array []
    "]
    bb0_instrs --> bb0_terminal(["If (read a$6)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Let mutate y$10_@0[1:9] = Array []
    "]
    bb2_instrs --> bb2_terminal(["If (read b$7)"])
  end
  subgraph bb4
    bb4_instrs["
      [5] Call mutate y$10_@0.push(read c$8)
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [7] Call mutate x$9_@0.push(mutate y$10_@0)
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze x$9_@0"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb2
  bb0_terminal -- "else" --> bb1
  bb2_terminal -- "then" --> bb4
  bb2_terminal -- "else" --> bb3
  bb4_terminal --> bb3
  bb3_terminal --> bb1

```

## Code

```javascript
function foo$0(a$6, b$7, c$8) {
  const x$9 = [];
  bb1: if (a$6) {
    const y$10 = [];

    bb3: if (b$7) {
      y$10.push(c$8);
    }

    x$9.push(y$10);
  }

  return x$9;
}

```
      