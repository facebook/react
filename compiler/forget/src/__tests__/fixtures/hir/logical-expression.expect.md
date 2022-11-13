
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
  [1] Const mutate $5 = Call mutate f$1()
  If (read $5) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [2] Const mutate $3 = Call mutate g$4()
  Goto bb1
bb3:
  predecessor blocks: bb0
  [3] Const mutate $3 = read $5
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  Return freeze $3
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate $5 = Call mutate f$1()
    "]
    bb0_instrs --> bb0_terminal(["If (read $5)"])
  end
  subgraph bb2
    bb2_instrs["
      [2] Const mutate $3 = Call mutate g$4()
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [3] Const mutate $3 = read $5
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze $3"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb3
  bb0_terminal -- fallthrough --> bb1
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
  [1] Const mutate $5 = Call mutate f$1()
  If (read $5) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [2] Const mutate $3 = read $5
  Goto bb1
bb3:
  predecessor blocks: bb0
  [3] Const mutate $3 = Call mutate g$4()
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  Return freeze $3
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate $5 = Call mutate f$1()
    "]
    bb0_instrs --> bb0_terminal(["If (read $5)"])
  end
  subgraph bb2
    bb2_instrs["
      [2] Const mutate $3 = read $5
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [3] Const mutate $3 = Call mutate g$4()
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze $3"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb3
  bb0_terminal -- fallthrough --> bb1
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
  [1] Const mutate $9 = Call mutate f$2()
  [2] Const mutate $10 = null
  [3] Const mutate $11 = Binary read $9 != read $10
  If (read $11) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [4] Const mutate $6 = read $9
  Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Const mutate $6 = Call mutate g$7()
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  Return freeze $6
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate $9 = Call mutate f$2()
      [2] Const mutate $10 = null
      [3] Const mutate $11 = Binary read $9 != read $10
    "]
    bb0_instrs --> bb0_terminal(["If (read $11)"])
  end
  subgraph bb2
    bb2_instrs["
      [4] Const mutate $6 = read $9
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [5] Const mutate $6 = Call mutate g$7()
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze $6"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb3
  bb0_terminal -- fallthrough --> bb1
  bb2_terminal --> bb1
  bb3_terminal --> bb1

```

## Code

```javascript
function QuestionQuestion$0(props$8) {
  bb1: if (f$2() != null) {
  } else {
  }
  return g$7();
}

```
## HIR

```
bb0:
  Return
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
function f$0() {
  return;
}

```
## HIR

```
bb0:
  Return
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
function g$0() {
  return;
}

```
      