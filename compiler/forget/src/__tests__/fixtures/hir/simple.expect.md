
## Input

```javascript
function foo(x, y) {
  if (x) {
    return foo(false, y);
  }
  return [y * 10];
}

```

## HIR

```
bb0:
  [1] If (read x$1) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [2] Const mutate $3_@0 = false
  [3] Const mutate $4_@1 = Call read foo$0(read $3_@0, read y$2)
  [4] Return freeze $4_@1
bb1:
  predecessor blocks: bb0
  [5] Const mutate $5_@2 = 10
  [6] Const mutate $6_@3 = Binary read y$2 * read $5_@2
  [7] Const mutate $7_@4 = Array [read $6_@3]
  [8] Return freeze $7_@4
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_terminal(["If (read x$1)"])
  end
  subgraph bb2
    bb2_instrs["
      [2] Const mutate $3_@0 = false
      [3] Const mutate $4_@1 = Call read foo$0(read $3_@0, read y$2)
    "]
    bb2_instrs --> bb2_terminal(["Return freeze $4_@1"])
  end
  subgraph bb1
    bb1_instrs["
      [5] Const mutate $5_@2 = 10
      [6] Const mutate $6_@3 = Binary read y$2 * read $5_@2
      [7] Const mutate $7_@4 = Array [read $6_@3]
    "]
    bb1_instrs --> bb1_terminal(["Return freeze $7_@4"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb2
  bb0_terminal -- "else" --> bb1

```

## Code

```javascript
function foo$0(x$1, y$2) {
  bb1: if (x$1) {
    return foo$0(false, y$2);
  }
  return [y$2 * 10];
}

```
      