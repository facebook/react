
## Input

```javascript
function compute() {}
function foo() {}
function Foo() {}

/**
 * Should produce 1 scope:
 *
 * return: inputs=props.a & props.b & props.c; outputs=return
 *   const a = compute(props.a);
 *   const b = compute(props.b);
 *   if (props.c)
 *     foo(a, b);
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  if (props.c) {
    foo(a, b);
  }
  return <Foo a={a} b={b} />;
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
function compute$0() {
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
function foo$0() {
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
function Foo$0() {
  return;
}

```
## HIR

```
bb0:
  [1] Const mutate a$2_@0[1:3] = Call mutate compute$3_@0(read props$1.a)
  [2] Const mutate b$4_@0[2:3] = Call mutate compute$3_@0(read props$1.b)
  If (read props$1.c) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [3] Call mutate foo$5_@0(mutate a$2_@0, mutate b$4_@0)
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [4] Const mutate $7_@1 = JSX <read Foo$6 a={freeze a$2_@0} b={freeze b$4_@0} ></read Foo$6>
  Return read $7_@1
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$2_@0[1:3] = Call mutate compute$3_@0(read props$1.a)
      [2] Const mutate b$4_@0[2:3] = Call mutate compute$3_@0(read props$1.b)
    "]
    bb0_instrs --> bb0_terminal(["If (read props$1.c)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Call mutate foo$5_@0(mutate a$2_@0, mutate b$4_@0)
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [4] Const mutate $7_@1 = JSX <read Foo$6 a={freeze a$2_@0} b={freeze b$4_@0} ></read Foo$6>
    "]
    bb1_instrs --> bb1_terminal(["Return read $7_@1"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb1
  bb2_terminal --> bb1

```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = compute$3(props$1.a);
  const b$4 = compute$3(props$1.b);
  bb1: if (props$1.c) {
    foo$5(a$2, b$4);
  }

  return <Foo$6 a={a$2} b={b$4}></Foo$6>;
}

```
      