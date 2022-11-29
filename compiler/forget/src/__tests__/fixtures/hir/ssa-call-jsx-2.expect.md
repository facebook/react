
## Input

```javascript
// @Pass runMutableRangeAnalysis
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  if (foo()) {
    let _ = <div a={a} />;
  }
  foo(a, b);
  return <div a={a} b={b} />;
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
function foo$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$11_@0[0:10] = Array []
  [2] Const mutate b$12_@0[0:10] = Object {  }
  [3] Call mutate foo$4_@0(mutate a$11_@0, mutate b$12_@0)
  [4] Const mutate $13_@0[0:10] = Call mutate foo$4_@0()
  [5] If (read $13_@0) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [6] Const mutate $14_@1 = "div"
  [7] Let mutate _$15_@2 = JSX <read $14_@1 a={freeze a$11_@0} ></read $14_@1>
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [9] Call mutate foo$4_@0(read a$11_@0, mutate b$12_@0)
  [10] Const mutate $19_@3 = "div"
  [11] Const mutate $20_@4 = JSX <read $19_@3 a={freeze a$11_@0} b={freeze b$12_@0} ></read $19_@3>
  [12] Return read $20_@4
scope2 [7:8]:
 - read $14_@1
scope4 [11:12]:
 - read $19_@3
 - freeze a$11_@0
 - freeze b$12_@0
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$11_@0[0:10] = Array []
      [2] Const mutate b$12_@0[0:10] = Object {  }
      [3] Call mutate foo$4_@0(mutate a$11_@0, mutate b$12_@0)
      [4] Const mutate $13_@0[0:10] = Call mutate foo$4_@0()
    "]
    bb0_instrs --> bb0_terminal(["If (read $13_@0)"])
  end
  subgraph bb2
    bb2_instrs["
      [6] Const mutate $14_@1 = 'div'
      [7] Let mutate _$15_@2 = JSX <read $14_@1 a={freeze a$11_@0} ></read $14_@1>
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [9] Call mutate foo$4_@0(read a$11_@0, mutate b$12_@0)
      [10] Const mutate $19_@3 = 'div'
      [11] Const mutate $20_@4 = JSX <read $19_@3 a={freeze a$11_@0} b={freeze b$12_@0} ></read $19_@3>
    "]
    bb1_instrs --> bb1_terminal(["Return read $20_@4"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb2
  bb0_terminal -- "else" --> bb1
  bb2_terminal --> bb1

```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = [];
  const b$3 = {};
  foo$4(a$2, b$3);
  bb1: if (foo$4()) {
    let _$5 = <div a={a$2}></div>;
  }

  foo$4(a$2, b$3);
  return <div a={a$2} b={b$3}></div>;
}

```
      