
## Input

```javascript
function foo(a, b, c) {
  const x = [];
  if (a) {
    const y = [];
    y.push(b);
    x.push(<div>{y}</div>);
  } else {
    x.push(c);
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$11_@0[1:11] = Array []
  [2] If (read a$8) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate y$12_@1[3:5] = Array []
  [4] Call mutate y$12_@1.push(read b$9)
  [5] Const mutate $13_@2 = "div"
  [6] Const mutate $14_@3 = JSX <read $13_@2>{freeze y$12_@1}</read $13_@2>
  [7] Call mutate x$11_@0.push(read $14_@3)
  [8] Goto bb1
bb3:
  predecessor blocks: bb0
  [9] Call mutate x$11_@0.push(read c$10)
  [10] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [11] Return freeze x$11_@0
scope0 [1:11]:
  - dependency: read c$10
  - dependency: read a$8
scope1 [3:5]:
  - dependency: read b$9
scope3 [6:7]:
  - dependency: read $13_@2
  - dependency: freeze y$12_@1
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:11] deps=[read c$10, read a$8] {
    [1] Const mutate x$11_@0[1:11] = Array []
    if (read a$8) {
      scope @1 [3:5] deps=[read b$9] {
        [3] Const mutate y$12_@1[3:5] = Array []
        [4] Call mutate y$12_@1.push(read b$9)
      }
      [5] Const mutate $13_@2 = "div"
      scope @3 [6:7] deps=[read $13_@2, freeze y$12_@1] {
        [6] Const mutate $14_@3 = JSX <read $13_@2>{freeze y$12_@1}</read $13_@2>
      }
      [7] Call mutate x$11_@0.push(read $14_@3)
    } else {
      [9] Call mutate x$11_@0.push(read c$10)
    }
  }
  return freeze x$11_@0
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate x$11_@0[1:11] = Array []
    "]
    bb0_instrs --> bb0_terminal(["If (read a$8)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Const mutate y$12_@1[3:5] = Array []
      [4] Call mutate y$12_@1.push(read b$9)
      [5] Const mutate $13_@2 = 'div'
      [6] Const mutate $14_@3 = JSX <read $13_@2>{freeze y$12_@1}</read $13_@2>
      [7] Call mutate x$11_@0.push(read $14_@3)
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [9] Call mutate x$11_@0.push(read c$10)
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return freeze x$11_@0"])
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
function foo$0(a$8, b$9, c$10) {
  const x$11 = [];
  bb1: if (a$8) {
    const y$12 = [];
    y$12.push(b$9);
    x$11.push(<div>{y$12}</div>);
  } else {
    x$11.push(c$10);
  }

  return x$11;
}

```
      