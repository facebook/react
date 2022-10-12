
## Input

```javascript
// @Out DefUseGraph
function Component(props) {
  const items = props.items;
  const maxItems = props.maxItems;

  const renderedItems = [];
  const seen = new Set();
  const max = Math.max(0, maxItems);
  for (const item of items) {
    if (item == null || seen.has(item)) {
      continue;
    }
    seen.add(item);
    renderedItems.push(<div>{item}</div>);
    if (renderedItems.length >= max) {
      break;
    }
  }
  const count = renderedItems.length;
  return (
    <div>
      <h1>{count} Items</h1>
      {renderedItems}
    </div>
  );
}

```

## HIR

```
bb0:
  Const mutable items$2 = readonly props$1.items
  Const mutable maxItems$3 = readonly props$1.maxItems
  Const mutable renderedItems$4 = Array []
  Const mutable seen$5 = New mutable Set$6()
  Const mutable $9 = 0
  Const mutable max$7 = Call mutable Math$8.max(readonly $9, readonly maxItems$3)
  Goto bb1
bb1:
  If (readonly items$2) then:bb3 else:bb2
bb3:
  Const mutable $11 = null
  Const mutable $12 = Binary readonly item$10 == readonly $11
  If (readonly $12) then:bb8 else:bb9
bb8:
  Const mutable $13 = readonly $12
  Goto bb7
bb9:
  Const mutable $13 = Call mutable seen$5.has(mutable item$10)
  Goto bb7
bb7:
  If (readonly $13) then:bb1 else:bb4
bb4:
  Call mutable seen$5.add(mutable item$10)
  Const mutable $14 = "div"
  Const mutable $15 = JSX <readonly $14>{readonly item$10}</readonly $14>
  Call mutable renderedItems$4.push(readonly $15)
  Const mutable $16 = Binary readonly renderedItems$4.length >= readonly max$7
  If (readonly $16) then:bb2 else:bb1
bb2:
  Const mutable count$17 = readonly renderedItems$4.length
  Const mutable $18 = "div"
  Const mutable $19 = "\n      "
  Const mutable $20 = "h1"
  Const mutable $21 = " Items"
  Const mutable $22 = JSX <readonly $20>{freeze count$17}{readonly $21}</readonly $20>
  Const mutable $23 = "\n      "
  Const mutable $24 = "\n    "
  Const mutable $25 = JSX <readonly $18>{readonly $19}{readonly $22}{readonly $23}{freeze renderedItems$4}{readonly $24}</readonly $18>
  Return readonly $25
```

## Code

```javascript
function Component$0(props$1) {
  const items$2 = props$1.items;
  const maxItems$3 = props$1.maxItems;
  const renderedItems$4 = [];
  const seen$5 = new Set$6();
  const max$7 = Math$8.max(0, maxItems$3);
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      