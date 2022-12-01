
## Input

```javascript
function And() {
  return f() && g();
}

function Or() {
  return f() || g();
}

function QuestionQuestion(props) {
  return f() ?? g();
}

function f() {}
function g() {}

```

## HIR

```
bb0:
  [1] Const mutate $5_@0[0:2] = Call mutate f$1_@0()
  [2] If (read $5_@0) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [3] Const mutate $6_@1[0:6] = Call mutate g$4_@1()
  [4] Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Const mutate $7_@1[0:6] = read $5_@0
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  $8_@1[0:6]: phi(bb2: $6_@1, bb3: $7_@1)
  [7] Return freeze $8_@1

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate $5_@0[0:2] = Call mutate f$1_@0()
    "]
    bb0_instrs --> bb0_terminal(["If (read $5_@0)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Const mutate $6_@1[0:6] = Call mutate g$4_@1()
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [5] Const mutate $7_@1[0:6] = read $5_@0
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze $8_@1"])
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
function And$0() {
  bb1: if (f$1()) {
  } else {
  }
  return f$1();
}

```
## HIR

```
bb0:
  [1] Const mutate $5_@0[0:2] = Call mutate f$1_@0()
  [2] If (read $5_@0) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [3] Const mutate $6_@1[0:6] = read $5_@0
  [4] Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Const mutate $7_@1[0:6] = Call mutate g$4_@1()
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  $8_@1[0:6]: phi(bb2: $6_@1, bb3: $7_@1)
  [7] Return freeze $8_@1

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate $5_@0[0:2] = Call mutate f$1_@0()
    "]
    bb0_instrs --> bb0_terminal(["If (read $5_@0)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Const mutate $6_@1[0:6] = read $5_@0
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [5] Const mutate $7_@1[0:6] = Call mutate g$4_@1()
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze $8_@1"])
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
function Or$0() {
  bb1: if (f$1()) {
  } else {
  }
  return g$4();
}

```
## HIR

```
bb0:
  [1] Const mutate $9_@0[0:2] = Call mutate f$2_@0()
  [2] Const mutate $10_@1 = null
  [3] Const mutate $11_@2 = Binary read $9_@0 != read $10_@1
  [4] If (read $11_@2) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [5] Const mutate $12_@3[0:8] = read $9_@0
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Const mutate $13_@3[0:8] = Call mutate g$7_@3()
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  $14_@3[0:8]: phi(bb2: $12_@3, bb3: $13_@3)
  [9] Return freeze $14_@3
scope2 [3:4]:
 - read $9_@0
 - read $10_@1
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate $9_@0[0:2] = Call mutate f$2_@0()
      [2] Const mutate $10_@1 = null
      [3] Const mutate $11_@2 = Binary read $9_@0 != read $10_@1
    "]
    bb0_instrs --> bb0_terminal(["If (read $11_@2)"])
  end
  subgraph bb2
    bb2_instrs["
      [5] Const mutate $12_@3[0:8] = read $9_@0
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [7] Const mutate $13_@3[0:8] = Call mutate g$7_@3()
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze $14_@3"])
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
function QuestionQuestion$0(props$1) {
  bb1: if (f$2() != null) {
  } else {
  }
  return g$7();
}

```
## HIR

```
bb0:
  [1] Return

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_terminal(["Return"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function f$0() {}

```
## HIR

```
bb0:
  [1] Return

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_terminal(["Return"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function g$0() {}

```
      