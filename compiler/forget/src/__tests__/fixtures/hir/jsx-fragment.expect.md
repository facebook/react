
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
  [2] Const mutate $15:TPrimitive = " "
  [3] Const mutate $16 = "\n      "
  [4] Const mutate $17:TPrimitive = "div"
  [5] Const mutate $18 = "\n        "
  [6] Const mutate $19 = "Text"
  [7] Const mutate $20_@0 = JsxFragment [read $19]
  [8] Const mutate $21 = "\n      "
  [9] Const mutate $22_@1 = JSX <read $17:TPrimitive>{read $18}{read $20_@0}{read $21}</read $17:TPrimitive>
  [10] Const mutate $23 = "\n    "
  [11] Const mutate $24_@2 = JsxFragment [read $14, read props$13.greeting, read $15:TPrimitive, read $16, read $22_@1, read $23]
  [12] Return read $24_@2
scope0 [7:8]:
  - dependency: read $19
scope1 [9:10]:
  - dependency: read $17:TPrimitive
  - dependency: read $18
  - dependency: read $20_@0
  - dependency: read $21
scope2 [11:12]:
  - dependency: read $14
  - dependency: read props$13.greeting
  - dependency: read $15:TPrimitive
  - dependency: read $16
  - dependency: read $22_@1
  - dependency: read $23
```

## Reactive Scopes

```
function Foo(
  props,
) {
  [1] Const mutate $14 = "\n      Hello "
  [2] Const mutate $15:TPrimitive = " "
  [3] Const mutate $16 = "\n      "
  [4] Const mutate $17:TPrimitive = "div"
  [5] Const mutate $18 = "\n        "
  [6] Const mutate $19 = "Text"
  scope @0 [7:8] deps=[] {
    [7] Const mutate $20_@0 = JsxFragment [read $19]
  }
  [8] Const mutate $21 = "\n      "
  scope @1 [9:10] deps=[read $20_@0] {
    [9] Const mutate $22_@1 = JSX <read $17:TPrimitive>{read $18}{read $20_@0}{read $21}</read $17:TPrimitive>
  }
  [10] Const mutate $23 = "\n    "
  scope @2 [11:12] deps=[read props$13.greeting, read $22_@1] {
    [11] Const mutate $24_@2 = JsxFragment [read $14, read props$13.greeting, read $15:TPrimitive, read $16, read $22_@1, read $23]
  }
  return read $24_@2
}

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
      