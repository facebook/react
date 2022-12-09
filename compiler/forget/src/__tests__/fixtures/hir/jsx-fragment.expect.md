
## Input

```javascript
function Foo(props) {
  return (
    <>
      Hello {props.greeting}{" "}
      <div>
        <>Text</>
      </div>
    </>
  );
}

```

## HIR

```
bb0:
  [1] Const mutate $14_@0 = "\n      Hello "
  [2] Const mutate $15_@1 = " "
  [3] Const mutate $16_@2 = "\n      "
  [4] Const mutate $17_@3 = "div"
  [5] Const mutate $18_@4 = "\n        "
  [6] Const mutate $19_@5 = "Text"
  [7] Const mutate $20_@6 = JsxFragment [read $19_@5]
  [8] Const mutate $21_@7 = "\n      "
  [9] Const mutate $22_@8 = JSX <read $17_@3>{read $18_@4}{read $20_@6}{read $21_@7}</read $17_@3>
  [10] Const mutate $23_@9 = "\n    "
  [11] Const mutate $24_@10 = JsxFragment [read $14_@0, read props$13.greeting, read $15_@1, read $16_@2, read $22_@8, read $23_@9]
  [12] Return read $24_@10
scope6 [7:8]:
  - dependency: read $19_@5
scope8 [9:10]:
  - dependency: read $17_@3
  - dependency: read $18_@4
  - dependency: read $20_@6
  - dependency: read $21_@7
scope10 [11:12]:
  - dependency: read $14_@0
  - dependency: read props$13.greeting
  - dependency: read $15_@1
  - dependency: read $16_@2
  - dependency: read $22_@8
  - dependency: read $23_@9
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate $14_@0 = '\n      Hello '
      [2] Const mutate $15_@1 = ' '
      [3] Const mutate $16_@2 = '\n      '
      [4] Const mutate $17_@3 = 'div'
      [5] Const mutate $18_@4 = '\n        '
      [6] Const mutate $19_@5 = 'Text'
      [7] Const mutate $20_@6 = JsxFragment [read $19_@5]
      [8] Const mutate $21_@7 = '\n      '
      [9] Const mutate $22_@8 = JSX <read $17_@3>{read $18_@4}{read $20_@6}{read $21_@7}</read $17_@3>
      [10] Const mutate $23_@9 = '\n    '
      [11] Const mutate $24_@10 = JsxFragment [read $14_@0, read props$13.greeting, read $15_@1, read $16_@2, read $22_@8, read $23_@9]
    "]
    bb0_instrs --> bb0_terminal(["Return read $24_@10"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function Foo$0(props$13) {
  return (
    <>
      Hello {props$13.greeting}
      {<div>{<>Text</>}</div>}
    </>
  );
}

```
      