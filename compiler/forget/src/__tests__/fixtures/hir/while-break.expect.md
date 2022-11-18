
## Input

```javascript
function foo(a, b) {
  while (a) {
    break;
  }
  return b;
}

```

## HIR

```
bb0:
  While test=bb1 loop=bb2 fallthrough=bb2
bb1:
  predecessor blocks: bb0
  If (read a$1) then:bb2 else:bb2
bb2:
  predecessor blocks: bb1
  Return read b$2
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_terminal(["While"])
  end
  subgraph bb1
    bb1_terminal(["If (read a$1)"])
  end
  subgraph bb2
    bb2_terminal(["Return read b$2"])
  end

  %% Jumps
  bb0_terminal -- "test" --> bb1
  bb0_terminal -- "loop" --> bb2
  bb0_terminal -- "fallthrough" --> bb2
  bb1_terminal -- "then" --> bb2
  bb1_terminal -- "else" --> bb2

```

## Code

```javascript
function foo$0(a$1, b$2) {
  bb2: while (a$1) {
    break;
  }
  return b$2;
}

```
      