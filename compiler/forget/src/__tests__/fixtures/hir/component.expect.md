
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
  frozen items$2 = frozen props$1.items
  frozen maxItems$3 = frozen props$1.maxItems
  readonly renderedItems$4 = Array []
  readonly seen$5 = New mutable Set$6()
  readonly $9 = 0
  readonly max$7 = Call mutable Math$8.max(mutable $9, frozen maxItems$3)
  Goto bb1
bb1:
  If (frozen items$2) then:bb3 else:bb2
bb3:
  readonly $11 = null
  frozen $12 = Binary frozen item$10 == readonly $11
  If (frozen $12) then:bb8 else:bb9
bb2:
  readonly count$17 = readonly renderedItems$4.length
  readonly $18 = "div"
  readonly $19 = "\n      "
  readonly $20 = "h1"
  readonly $21 = " Items"
  readonly $22 = JSX <frozen $20>{frozen count$17}{frozen $21}</frozen $20>
  readonly $23 = "\n      "
  readonly $24 = "\n    "
  readonly $25 = JSX <frozen $18>{frozen $19}{frozen $22}{frozen $23}{frozen renderedItems$4}{frozen $24}</frozen $18>
  Return frozen $25
bb8:
  frozen $13 = frozen $12
  Goto bb7
bb9:
  readonly $13 = Call mutable seen$5.has(frozen item$10)
  Goto bb7
bb7:
  If (frozen $13) then:bb1 else:bb4
bb4:
  Call mutable seen$5.add(frozen item$10)
  readonly $14 = "div"
  readonly $15 = JSX <frozen $14>{frozen item$10}</frozen $14>
  Call mutable renderedItems$4.push(mutable $15)
  frozen $16 = Binary readonly renderedItems$4.length >= readonly max$7
  If (frozen $16) then:bb2 else:bb1
```

## Code

```javascript
function Component$0(props$1) {
  items$2 = props$1.items;
  maxItems$3 = props$1.maxItems;
  renderedItems$4 = [];
  seen$5 = new Set$6();
  max$7 = Math$8.max(0, maxItems$3);
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      