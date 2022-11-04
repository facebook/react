
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
  [1] Const mutate $14 = "\n      Hello "
  [2] Const mutate $15 = " "
  [3] Const mutate $16 = "\n      "
  [4] Const mutate $17 = "div"
  [5] Const mutate $18 = "\n        "
  [6] Const mutate $19 = "Text"
  [7] Const mutate $20 = JsxFragment [read $19]
  [8] Const mutate $21 = "\n      "
  [9] Const mutate $22 = JSX <read $17>{read $18}{read $20}{read $21}</read $17>
  [10] Const mutate $23 = "\n    "
  [11] Const mutate $24 = JsxFragment [read $14, read props$13.greeting, read $15, read $16, read $22, read $23]
  Return read $24
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
      