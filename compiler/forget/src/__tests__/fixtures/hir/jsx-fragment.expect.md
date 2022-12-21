
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
  [1] Const mutate $14:TPrimitive = "\n      Hello "
  [2] Const mutate $15:TPrimitive = " "
  [3] Const mutate $16:TPrimitive = "\n      "
  [4] Const mutate $17:TPrimitive = "div"
  [5] Const mutate $18:TPrimitive = "\n        "
  [6] Const mutate $19:TPrimitive = "Text"
  [7] Const mutate t0$20_@0 = JsxFragment [read $19:TPrimitive]
  [8] Const mutate $21:TPrimitive = "\n      "
  [9] Const mutate t2$22_@1 = JSX <read $17:TPrimitive>{read $18:TPrimitive}{read t0$20_@0}{read $21:TPrimitive}</read $17:TPrimitive>
  [10] Const mutate $23:TPrimitive = "\n    "
  [11] Const mutate t5$24_@2 = JsxFragment [read $14:TPrimitive, read props$13.greeting, read $15:TPrimitive, read $16:TPrimitive, read t2$22_@1, read $23:TPrimitive]
  [12] Return read t5$24_@2
```

## Reactive Scopes

```
function Foo(
  props,
) {
  [1] Const mutate $14:TPrimitive = "\n      Hello "
  [2] Const mutate $15:TPrimitive = " "
  [3] Const mutate $16:TPrimitive = "\n      "
  [4] Const mutate $17:TPrimitive = "div"
  [5] Const mutate $18:TPrimitive = "\n        "
  [6] Const mutate $19:TPrimitive = "Text"
  scope @0 [7:8] deps=[] out=[$20_@0] {
    [7] Const mutate $20_@0 = JsxFragment [read $19:TPrimitive]
  }
  [8] Const mutate $21:TPrimitive = "\n      "
  scope @1 [9:10] deps=[read $20_@0] out=[$22_@1] {
    [9] Const mutate $22_@1 = JSX <read $17:TPrimitive>{read $18:TPrimitive}{read $20_@0}{read $21:TPrimitive}</read $17:TPrimitive>
  }
  [10] Const mutate $23:TPrimitive = "\n    "
  scope @2 [11:12] deps=[read props$13.greeting, read $22_@1] out=[$24_@2] {
    [11] Const mutate $24_@2 = JsxFragment [read $14:TPrimitive, read props$13.greeting, read $15:TPrimitive, read $16:TPrimitive, read $22_@1, read $23:TPrimitive]
  }
  return read $24_@2
}

```

## Code

```javascript
function Foo$0(props$13) {
  const $ = React.useMemoCache();
  let t0$20;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0$20 = <>Text</>;
    $[0] = t0$20;
  } else {
    t0$20 = $[0];
  }

  const c_1 = $[1] !== t0$20;
  let t2$22;

  if (c_1) {
    t2$22 = <div>{t0$20}</div>;
    $[1] = t0$20;
    $[2] = t2$22;
  } else {
    t2$22 = $[2];
  }

  const c_3 = $[3] !== props$13.greeting;
  const c_4 = $[4] !== t2$22;
  let t5$24;

  if (c_3 || c_4) {
    t5$24 = (
      <>
        Hello {props$13.greeting}
        {t2$22}
      </>
    );
    $[3] = props$13.greeting;
    $[4] = t2$22;
    $[5] = t5$24;
  } else {
    t5$24 = $[5];
  }

  return t5$24;
}

```
      