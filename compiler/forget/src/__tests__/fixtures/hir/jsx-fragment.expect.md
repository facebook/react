
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
  Const mutate $14 = "\n      Hello "
  Const mutate $15 = " "
  Const mutate $16 = "\n      "
  Const mutate $17 = "div"
  Const mutate $18 = "\n        "
  Const mutate $19 = "Text"
  Const mutate $20 = JsxFragment [read $19]
  Const mutate $21 = "\n      "
  Const mutate $22 = JSX <read $17>{read $18}{read $20}{read $21}</read $17>
  Const mutate $23 = "\n    "
  Const mutate $24 = JsxFragment [read $14, read props$13.greeting, read $15, read $16, read $22, read $23]
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
      