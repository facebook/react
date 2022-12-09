
## Input

```javascript
function foo(a) {
  const x = {};
  if (a) {
    let y = {};
    x.y = y;
    mutate(y); // aliases x & y, but not z
  } else {
    let z = {};
    x.z = z;
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0[0:10] = Object {  }
  [2] If (read a$6) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate y$8_@0[0:10] = Object {  }
  [4] Reassign mutate x$7_@0.y[0:10] = read y$8_@0
  [5] Call mutate mutate$4_@0(mutate y$8_@0)
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Const mutate z$9_@1 = Object {  }
  [8] Reassign mutate x$7_@0.z[0:10] = read z$9_@1
  [9] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [10] Return freeze x$7_@0
scope1 [7:8]:
  - dependency: mutate x$7_@0.z
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate x$7_@0[0:10] = Object {  }
    "]
    bb0_instrs --> bb0_terminal(["If (read a$6)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Const mutate y$8_@0[0:10] = Object {  }
      [4] Reassign mutate x$7_@0.y[0:10] = read y$8_@0
      [5] Call mutate mutate$4_@0(mutate y$8_@0)
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [7] Const mutate z$9_@1 = Object {  }
      [8] Reassign mutate x$7_@0.z[0:10] = read z$9_@1
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze x$7_@0"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb2
  bb0_terminal -- "else" --> bb3
  bb0_terminal -- "fallthrough" --> bb1
  bb2_terminal --> bb1
  bb3_terminal --> bb1

```

## Code

```javascript
function foo$0(a$6) {
  const x$7 = {};
  bb1: if (a$6) {
    const y$8 = {};
    x$7.y = y$8;
    mutate$4(y$8);
  } else {
    const z$9 = {};
    x$7.z = z$9;
  }

  return x$7;
}

```
      