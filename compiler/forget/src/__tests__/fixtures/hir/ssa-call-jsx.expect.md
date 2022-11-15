
## Input

```javascript
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  let _ = <div a={a} />;
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
  [2] Const mutate b$3[2:6] = Object {  }
  [3] Call mutate foo$4(mutate a$2, mutate b$3)
  [4] Const mutate $6 = "div"
  [5] Let mutate _$5 = JSX <read $6 a={freeze a$2} ></read $6>
  [6] Call mutate foo$4(read a$2, mutate b$3)
  [7] Const mutate $7 = "div"
  [8] Const mutate $8 = JSX <read $7 a={read a$2} b={freeze b$3} ></read $7>
  Return read $8
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$2[1:3] = Array []
      [2] Const mutate b$3[2:6] = Object {  }
      [3] Call mutate foo$4(mutate a$2, mutate b$3)
      [4] Const mutate $6 = 'div'
      [5] Let mutate _$5 = JSX <read $6 a={freeze a$2} ></read $6>
      [6] Call mutate foo$4(read a$2, mutate b$3)
      [7] Const mutate $7 = 'div'
      [8] Const mutate $8 = JSX <read $7 a={read a$2} b={freeze b$3} ></read $7>
    "]
    bb0_instrs --> bb0_terminal(["Return read $8"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = [];
  const b$3 = {};
  foo$4(a$2, b$3);
  let _$5 = <div a={a$2}></div>;

  foo$4(a$2, b$3);
  return <div a={a$2} b={b$3}></div>;
}

```
      