
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
  Const mutate items$2 = read props$1.items
  Const mutate maxItems$3 = read props$1.maxItems
  Const mutate renderedItems$4 = Array []
  Const mutate seen$5 = New mutate Set$6()
  Const mutate $9 = 0
  Const mutate max$7 = Call mutate Math$8.max(read $9, read maxItems$3)
  Goto bb1
bb1:
  If (read items$2) then:bb3 else:bb2
bb3:
  Const mutate $11 = null
  Const mutate $12 = Binary read item$10 == read $11
  If (read $12) then:bb8 else:bb9
bb8:
  Const mutate $13 = read $12
  Goto bb7
bb9:
  Const mutate $13 = Call mutate seen$5.has(mutate item$10)
  Goto bb7
bb7:
  If (read $13) then:bb1 else:bb4
bb4:
  Call mutate seen$5.add(mutate item$10)
  Const mutate $14 = "div"
  Const mutate $15 = JSX <read $14>{read item$10}</read $14>
  Call mutate renderedItems$4.push(read $15)
  Const mutate $16 = Binary read renderedItems$4.length >= read max$7
  If (read $16) then:bb2 else:bb1
bb2:
  Const mutate count$17 = read renderedItems$4.length
  Const mutate $18 = "div"
  Const mutate $19 = "\n      "
  Const mutate $20 = "h1"
  Const mutate $21 = " Items"
  Const mutate $22 = JSX <read $20>{freeze count$17}{read $21}</read $20>
  Const mutate $23 = "\n      "
  Const mutate $24 = "\n    "
  Const mutate $25 = JSX <read $18>{read $19}{read $22}{read $23}{freeze renderedItems$4}{read $24}</read $18>
  Return read $25
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
      