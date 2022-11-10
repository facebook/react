
## Input

```javascript
function Foo() {}

function Component(props) {
  const a = [];
  const b = {};
  let c = new Foo(a, b);
  return c;
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
function Foo$0() {
  return;
}

```
## HIR

```
bb0:
  [1] Const mutate a$7[1:3] = Array []
  [2] Const mutate b$8[2:3] = Object {  }
  [3] Let mutate c$9 = New mutate Foo$5(mutate a$7, mutate b$8)
  Return freeze c$9
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$7[1:3] = Array []
      [2] Const mutate b$8[2:3] = Object {  }
      [3] Let mutate c$9 = New mutate Foo$5(mutate a$7, mutate b$8)  
    "]    
    bb0_instrs --> bb0_terminal(["Return freeze c$9"])  
  end
  

  %% Jumps
  %% empty
```

## Code

```javascript
function Component$0(props$6) {
  const a$7 = [];
  const b$8 = {};
  let c$9 = new Foo$5(a$7, b$8);
  return c$9;
}

```
      