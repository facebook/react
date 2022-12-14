
## Input

```javascript
function Component(props) {
  const items = props.items;
  const maxItems = props.maxItems;

  const renderedItems = [];
  const seen = new Set();
  const max = Math.max(0, maxItems);
  for (let i = 0; i < items.length; i += 1) {
    const item = items.at(i);
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
  [1] Const mutate items$30:TProp = read props$29.items
  [2] Const mutate maxItems$31:TProp = read props$29.maxItems
  [3] Const mutate renderedItems$32_@0:TFunction[3:33] = Array []
  [4] Const mutate seen$33_@0:TFunction[3:33] = New mutate Set$6()
  [5] Const mutate $34:TPrimitive = 0
  [6] Const mutate max$35_@2:TPrimitive = Call mutate Math$8.max(read $34:TPrimitive, read maxItems$31:TProp)
  [7] For init=bb3 test=bb1 loop=bb5 update=bb4 fallthrough=bb2
bb3:
  predecessor blocks: bb0
  [8] Let mutate i$36_@0:TPrimitive[3:33] = 0
  [9] Goto bb1
bb1:
  predecessor blocks: bb3 bb4
  [10] Const mutate $39:TPrimitive = Binary read i$36_@0:TPrimitive < read items$30.length
  [11] If (read $39:TPrimitive) then:bb5 else:bb2 fallthrough=bb2
bb5:
  predecessor blocks: bb1
  [12] Const mutate item$40_@0:TPrimitive[3:33] = Call read items$30.at(read i$36_@0:TPrimitive)
  [13] Const mutate $41:TPrimitive = null
  [14] Const mutate $42:TPrimitive = Binary read item$40_@0:TPrimitive == read $41:TPrimitive
  [15] Let mutate $43_@0:TPrimitive[3:33] = undefined
  [15] If (read $42:TPrimitive) then:bb10 else:bb11 fallthrough=bb9
bb10:
  predecessor blocks: bb5
  [16] Const mutate $43_@0:TPrimitive[3:33] = read $42:TPrimitive
  [17] Goto bb9
bb11:
  predecessor blocks: bb5
  [18] Const mutate $43_@0:TPrimitive[3:33] = Call mutate seen$33_@0.has(mutate item$40_@0:TPrimitive)
  [19] Goto bb9
bb9:
  predecessor blocks: bb10 bb11
  [20] If (read $43_@0:TPrimitive) then:bb7 else:bb6 fallthrough=bb6
bb7:
  predecessor blocks: bb9
  [21] Goto(Continue) bb4
bb6:
  predecessor blocks: bb9
  [22] Call mutate seen$33_@0.add(mutate item$40_@0:TPrimitive)
  [23] Const mutate $49:TPrimitive = "div"
  [24] Const mutate $50_@3 = JSX <read $49:TPrimitive>{freeze item$40_@0:TPrimitive}</read $49:TPrimitive>
  [25] Call mutate renderedItems$32_@0.push(read $50_@3)
  [26] Const mutate $55:TPrimitive = Binary read renderedItems$32_@0.length >= read max$35_@2:TPrimitive
  [27] If (read $55:TPrimitive) then:bb2 else:bb12 fallthrough=bb12
bb12:
  predecessor blocks: bb6
  [28] Goto(Continue) bb4
bb4:
  predecessor blocks: bb7 bb12
  [29] Const mutate $56:TPrimitive = 1
  [30] Reassign mutate i$36_@0:TPrimitive[3:33] = Binary read i$36_@0:TPrimitive + read $56:TPrimitive
  [31] read i$36_@0:TPrimitive
  [32] Goto bb1
bb2:
  predecessor blocks: bb6 bb1
  [33] Const mutate count$66:TProp = read renderedItems$32_@0.length
  [34] Const mutate $67:TPrimitive = "div"
  [35] Const mutate $68 = "\n      "
  [36] Const mutate $69:TPrimitive = "h1"
  [37] Const mutate $70 = " Items"
  [38] Const mutate $71_@4 = JSX <read $69:TPrimitive>{freeze count$66:TProp}{read $70}</read $69:TPrimitive>
  [39] Const mutate $72 = "\n      "
  [40] Const mutate $73 = "\n    "
  [41] Const mutate $74_@5 = JSX <read $67:TPrimitive>{read $68}{read $71_@4}{read $72}{freeze renderedItems$32_@0:TFunction}{read $73}</read $67:TPrimitive>
  [42] Return read $74_@5
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate items$30:TProp = read props$29.items
  [2] Const mutate maxItems$31:TProp = read props$29.maxItems
  scope @0 [3:33] deps=[read maxItems$31:TProp, read items$30.length, read items$30] {
    [3] Const mutate renderedItems$32_@0:TFunction[3:33] = Array []
    [4] Const mutate seen$33_@0:TFunction[3:33] = New mutate Set$6()
    [5] Const mutate $34:TPrimitive = 0
    scope @2 [6:7] deps=[read maxItems$31:TProp] {
      [6] Const mutate max$35_@2:TPrimitive = Call mutate Math$8.max(read $34:TPrimitive, read maxItems$31:TProp)
    }
    for (
      [8] Let mutate i$36_@0:TPrimitive[3:33] = 0
    ;
      [10] Const mutate $39:TPrimitive = Binary read i$36_@0:TPrimitive < read items$30.length
      read $39:TPrimitive
    ;
      [29] Const mutate $56:TPrimitive = 1
      [30] Reassign mutate i$36_@0:TPrimitive[3:33] = Binary read i$36_@0:TPrimitive + read $56:TPrimitive
      read i$36_@0:TPrimitive
    ) {
      [12] Const mutate item$40_@0:TPrimitive[3:33] = Call read items$30.at(read i$36_@0:TPrimitive)
      [13] Const mutate $41:TPrimitive = null
      [14] Const mutate $42:TPrimitive = Binary read item$40_@0:TPrimitive == read $41:TPrimitive
      [15] Let mutate $43_@0:TPrimitive[3:33] = undefined
      if (read $42:TPrimitive) {
        [16] Const mutate $43_@0:TPrimitive[3:33] = read $42:TPrimitive
      } else {
        [18] Const mutate $43_@0:TPrimitive[3:33] = Call mutate seen$33_@0.has(mutate item$40_@0:TPrimitive)
      }
      if (read $43_@0:TPrimitive) {
        continue
      }
      [22] Call mutate seen$33_@0.add(mutate item$40_@0:TPrimitive)
      [23] Const mutate $49:TPrimitive = "div"
      [24] Const mutate $50_@3 = JSX <read $49:TPrimitive>{freeze item$40_@0:TPrimitive}</read $49:TPrimitive>
      [25] Call mutate renderedItems$32_@0.push(read $50_@3)
      [26] Const mutate $55:TPrimitive = Binary read renderedItems$32_@0.length >= read max$35_@2:TPrimitive
      if (read $55:TPrimitive) {
        break
      }
    }
  }
  [33] Const mutate count$66:TProp = read renderedItems$32_@0.length
  [34] Const mutate $67:TPrimitive = "div"
  [35] Const mutate $68 = "\n      "
  [36] Const mutate $69:TPrimitive = "h1"
  [37] Const mutate $70 = " Items"
  scope @4 [38:39] deps=[freeze count$66:TProp] {
    [38] Const mutate $71_@4 = JSX <read $69:TPrimitive>{freeze count$66:TProp}{read $70}</read $69:TPrimitive>
  }
  [39] Const mutate $72 = "\n      "
  [40] Const mutate $73 = "\n    "
  scope @5 [41:42] deps=[read $71_@4, freeze renderedItems$32_@0:TFunction] {
    [41] Const mutate $74_@5 = JSX <read $67:TPrimitive>{read $68}{read $71_@4}{read $72}{freeze renderedItems$32_@0:TFunction}{read $73}</read $67:TPrimitive>
  }
  return read $74_@5
}

```

## Code

```javascript
function Component$0(props$29) {
  const items$30 = props$29.items;
  const maxItems$31 = props$29.maxItems;
  const renderedItems$32 = [];
  const seen$33 = new Set$6();
  const max$35 = Math$8.max(0, maxItems$31);
  bb2: for (let i$36 = 0; i$36 < items$30.length; i$36 = i$36 + 1, i$36) {
    const item$40 = items$30.at(i$36);

    bb9: if (item$40 == null) {
    } else {
    }

    bb6: if (seen$33.has(item$40)) {
      continue;
    }

    seen$33.add(item$40);
    renderedItems$32.push(<div>{item$40}</div>);

    bb12: if (renderedItems$32.length >= max$35) {
      break;
    }
  }

  const count$66 = renderedItems$32.length;
  return (
    <div>
      {<h1>{count$66} Items</h1>}
      {renderedItems$32}
    </div>
  );
}

```
      