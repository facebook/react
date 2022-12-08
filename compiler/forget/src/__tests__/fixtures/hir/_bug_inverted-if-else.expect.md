
## Input

```javascript
function foo(a, b, c) {
  let x = null;
  label: {
    if (a) {
      x = b;
      break label;
    }
    x = c;
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$8_@0 = null
  [2] If (read a$5) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb0
  [3] Reassign mutate x$9_@1[3:6] = read b$6
  [4] Goto bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$10_@1[3:6] = read c$7
  [6] Goto bb1
bb1:
  predecessor blocks: bb3 bb2
  x$11_@1[3:6]: phi(bb3: x$9_@1, bb2: x$10_@1)
  [7] Return read x$11_@1
scope1 [3:6]:
 - read b$6
 - read a$5
 - read c$7
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$8_@0 = null
    "]
    bb0_instrs --> bb0_terminal(["If (read a$5)"])
  end
  subgraph bb3
    bb3_instrs["
      [3] Reassign mutate x$9_@1[3:6] = read b$6
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb2
    bb2_instrs["
      [5] Reassign mutate x$10_@1[3:6] = read c$7
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return read x$11_@1"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb3
  bb0_terminal -- "else" --> bb2
  bb3_terminal --> bb1
  bb2_terminal --> bb1

```

## Code

```javascript
function foo$0(a$5, b$6, c$7) {
  const x$8 = null;
  bb2: if (a$5) {
    const x$9 = b$6;
  }

  const x$10 = c$7;
}

```
      