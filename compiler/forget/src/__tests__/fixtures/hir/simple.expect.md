
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
  [1] If (read x$8) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [2] Const mutate $10_@0 = false
  [3] Const mutate $11_@1 = Call read foo$0(read $10_@0, read y$9)
  [4] Return freeze $11_@1
bb1:
  predecessor blocks: bb0
  [5] Const mutate $12_@2 = 10
  [6] Const mutate $13_@3 = Binary read y$9 * read $12_@2
  [7] Const mutate $14_@4 = Array [read $13_@3]
  [8] Return freeze $14_@4
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_terminal(["If (read x$8)"])
  end
  subgraph bb2
    bb2_instrs["
      [2] Const mutate $10_@0 = false
      [3] Const mutate $11_@1 = Call read foo$0(read $10_@0, read y$9)
    "]
    bb2_instrs --> bb2_terminal(["Return freeze $11_@1"])
  end
  subgraph bb1
    bb1_instrs["
      [5] Const mutate $12_@2 = 10
      [6] Const mutate $13_@3 = Binary read y$9 * read $12_@2
      [7] Const mutate $14_@4 = Array [read $13_@3]
    "]
    bb1_instrs --> bb1_terminal(["Return freeze $14_@4"])
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
      