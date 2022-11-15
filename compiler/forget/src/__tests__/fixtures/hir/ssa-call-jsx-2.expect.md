
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
function foo$0() {
  return;
}

```
## HIR

```
bb0:
  [1] Const mutate a$2[1:3] = Array []
  [2] Const mutate b$3[2:7] = Object {  }
  [3] Call mutate foo$4(mutate a$2, mutate b$3)
  [4] Const mutate $7 = Call mutate foo$4()
  If (read $7) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate $6 = "div"
  [6] Let mutate _$5 = JSX <read $6 a={freeze a$2} ></read $6>
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Call mutate foo$4(read a$2, mutate b$3)
  [8] Const mutate $8 = "div"
  [9] Const mutate $9 = JSX <read $8 a={freeze a$2} b={freeze b$3} ></read $8>
  Return read $9
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$2[1:3] = Array []
      [2] Const mutate b$3[2:7] = Object {  }
      [3] Call mutate foo$4(mutate a$2, mutate b$3)
      [4] Const mutate $7 = Call mutate foo$4()
    "]
    bb0_instrs --> bb0_terminal(["If (read $7)"])
  end
  subgraph bb2
    bb2_instrs["
      [5] Const mutate $6 = 'div'
      [6] Let mutate _$5 = JSX <read $6 a={freeze a$2} ></read $6>
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [7] Call mutate foo$4(read a$2, mutate b$3)
      [8] Const mutate $8 = 'div'
      [9] Const mutate $9 = JSX <read $8 a={freeze a$2} b={freeze b$3} ></read $8>
    "]
    bb1_instrs --> bb1_terminal(["Return read $9"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb1
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
      