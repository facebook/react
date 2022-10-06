
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
  Const frozen items$2 = frozen props$1.items
  Const frozen maxItems$3 = frozen props$1.maxItems
  Const readonly renderedItems$4 = Array []
  Const readonly seen$5 = New mutable Set$6()
  Const readonly $9 = 0
  Const readonly max$7 = Call mutable Math$8.max(mutable $9, frozen maxItems$3)
  Goto bb1
bb1:
  If (frozen items$2) then:bb3 else:bb2
bb3:
  Const readonly $11 = null
  Const frozen $12 = Binary frozen item$10 == readonly $11
  If (frozen $12) then:bb8 else:bb9
bb2:
  Const readonly count$17 = readonly renderedItems$4.length
  Const readonly $18 = "div"
  Const readonly $19 = "\n      "
  Const readonly $20 = "h1"
  Const readonly $21 = " Items"
  Const readonly $22 = JSX <frozen $20>{frozen count$17}{frozen $21}</frozen $20>
  Const readonly $23 = "\n      "
  Const readonly $24 = "\n    "
  Const readonly $25 = JSX <frozen $18>{frozen $19}{frozen $22}{frozen $23}{frozen renderedItems$4}{frozen $24}</frozen $18>
  Return frozen $25
bb8:
  Const frozen $13 = frozen $12
  Goto bb7
bb9:
  Const readonly $13 = Call mutable seen$5.has(frozen item$10)
  Goto bb7
bb7:
  If (frozen $13) then:bb1 else:bb4
bb4:
  Call mutable seen$5.add(frozen item$10)
  Const readonly $14 = "div"
  Const readonly $15 = JSX <frozen $14>{frozen item$10}</frozen $14>
  Call mutable renderedItems$4.push(mutable $15)
  Const frozen $16 = Binary readonly renderedItems$4.length >= readonly max$7
  If (frozen $16) then:bb2 else:bb1
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
      