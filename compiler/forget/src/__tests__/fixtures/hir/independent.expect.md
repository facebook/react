
## Input

```javascript
/**
 * Should produce 3 scopes:
 *
 * a: inputs=props.a, outputs=a
 *   a = compute(props.a);
 * b: inputs=props.b, outputs=b
 *   b = compute(props.b);
 * return: inputs=a, b outputs=return
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  return <Foo a={a} b={b} />;
}

function compute() {}
function foo() {}
function Foo() {}

```

## HIR

```
bb0:
  [1] Const mutate a$2_@0 = Call mutate compute$3_@0(read props$1.a)
  [2] Const mutate b$4_@0 = Call mutate compute$3_@0(read props$1.b)
  [3] Const mutate $6_@1 = JSX <read Foo$5 a={freeze a$2_@0} b={freeze b$4_@0} ></read Foo$5>
  Return read $6_@1
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$2_@0 = Call mutate compute$3_@0(read props$1.a)
      [2] Const mutate b$4_@0 = Call mutate compute$3_@0(read props$1.b)
      [3] Const mutate $6_@1 = JSX <read Foo$5 a={freeze a$2_@0} b={freeze b$4_@0} ></read Foo$5>
    "]
    bb0_instrs --> bb0_terminal(["Return read $6_@1"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = compute$3(props$1.a);
  const b$4 = compute$3(props$1.b);
  return <Foo$5 a={a$2} b={b$4}></Foo$5>;
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
      