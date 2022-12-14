
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
  [1] Const mutate items$30_@0:TProp = read props$29.items
  [2] Const mutate maxItems$31_@1:TProp = read props$29.maxItems
  [3] Const mutate renderedItems$32_@2:TFunction[3:33] = Array []
  [4] Const mutate seen$33_@2:TFunction[3:33] = New mutate Set$6()
  [5] Const mutate $34_@4:TPrimitive = 0
  [6] Const mutate max$35_@5:TPrimitive = Call mutate Math$8.max(read $34_@4:TPrimitive, read maxItems$31_@1:TProp)
  [7] For init=bb3 test=bb1 loop=bb5 update=bb4 fallthrough=bb2
bb3:
  predecessor blocks: bb0
  [8] Let mutate i$36_@2:TPrimitive[3:33] = 0
  [9] Goto bb1
bb1:
  predecessor blocks: bb3 bb4
  [10] Const mutate $39_@2:TPrimitive[3:33] = Binary read i$36_@2:TPrimitive < read items$30_@0.length
  [11] If (read $39_@2:TPrimitive) then:bb5 else:bb2 fallthrough=bb2
bb5:
  predecessor blocks: bb1
  [12] Const mutate item$40_@2:TPrimitive[3:33] = Call read items$30_@0.at(read i$36_@2:TPrimitive)
  [13] Const mutate $41_@6:TPrimitive = null
  [14] Const mutate $42_@2:TPrimitive[3:33] = Binary read item$40_@2:TPrimitive == read $41_@6:TPrimitive
  [15] Let mutate $43_@2:TPrimitive[3:33] = undefined
  [15] If (read $42_@2:TPrimitive) then:bb10 else:bb11 fallthrough=bb9
bb10:
  predecessor blocks: bb5
  [16] Const mutate $43_@2:TPrimitive[3:33] = read $42_@2:TPrimitive
  [17] Goto bb9
bb11:
  predecessor blocks: bb5
  [18] Const mutate $43_@2:TPrimitive[3:33] = Call mutate seen$33_@2.has(mutate item$40_@2:TPrimitive)
  [19] Goto bb9
bb9:
  predecessor blocks: bb10 bb11
  [20] If (read $43_@2:TPrimitive) then:bb7 else:bb6 fallthrough=bb6
bb7:
  predecessor blocks: bb9
  [21] Goto(Continue) bb4
bb6:
  predecessor blocks: bb9
  [22] Call mutate seen$33_@2.add(mutate item$40_@2:TPrimitive)
  [23] Const mutate $49_@7:TPrimitive = "div"
  [24] Const mutate $50_@8 = JSX <read $49_@7:TPrimitive>{freeze item$40_@2:TPrimitive}</read $49_@7:TPrimitive>
  [25] Call mutate renderedItems$32_@2.push(read $50_@8)
  [26] Const mutate $55_@9:TPrimitive = Binary read renderedItems$32_@2.length >= read max$35_@5:TPrimitive
  [27] If (read $55_@9:TPrimitive) then:bb2 else:bb12 fallthrough=bb12
bb12:
  predecessor blocks: bb6
  [28] Goto(Continue) bb4
bb4:
  predecessor blocks: bb7 bb12
  [29] Const mutate $56_@2:TPrimitive[3:33] = 1
  [30] Reassign mutate i$36_@2:TPrimitive[3:33] = Binary read i$36_@2:TPrimitive + read $56_@2:TPrimitive
  [31] read i$36_@2:TPrimitive
  [32] Goto bb1
bb2:
  predecessor blocks: bb6 bb1
  [33] Const mutate count$66_@11:TProp = read renderedItems$32_@2.length
  [34] Const mutate $67_@12:TPrimitive = "div"
  [35] Const mutate $68_@13 = "\n      "
  [36] Const mutate $69_@14:TPrimitive = "h1"
  [37] Const mutate $70_@15 = " Items"
  [38] Const mutate $71_@16 = JSX <read $69_@14:TPrimitive>{freeze count$66_@11:TProp}{read $70_@15}</read $69_@14:TPrimitive>
  [39] Const mutate $72_@17 = "\n      "
  [40] Const mutate $73_@18 = "\n    "
  [41] Const mutate $74_@19 = JSX <read $67_@12:TPrimitive>{read $68_@13}{read $71_@16}{read $72_@17}{freeze renderedItems$32_@2:TFunction}{read $73_@18}</read $67_@12:TPrimitive>
  [42] Return read $74_@19
scope0 [1:2]:
  - dependency: read props$29.items
scope1 [2:3]:
  - dependency: read props$29.maxItems
scope5 [6:7]:
  - dependency: read $34_@4:TPrimitive
  - dependency: read maxItems$31_@1:TProp
scope8 [24:25]:
  - dependency: read $49_@7:TPrimitive
scope9 [26:27]:
  - dependency: read max$35_@5:TPrimitive
scope11 [33:34]:
  - dependency: read renderedItems$32_@2.length
scope16 [38:39]:
  - dependency: read $69_@14:TPrimitive
  - dependency: freeze count$66_@11:TProp
  - dependency: read $70_@15
scope19 [41:42]:
  - dependency: read $67_@12:TPrimitive
  - dependency: read $68_@13
  - dependency: read $71_@16
  - dependency: read $72_@17
  - dependency: freeze renderedItems$32_@2:TFunction
  - dependency: read $73_@18
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate items$30_@0:TProp = read props$29.items
  [2] Const mutate maxItems$31_@1:TProp = read props$29.maxItems
  scope @2 [3:33] deps=[] {
    [3] Const mutate renderedItems$32_@2:TFunction[3:33] = Array []
    [4] Const mutate seen$33_@2:TFunction[3:33] = New mutate Set$6()
    [5] Const mutate $34_@4:TPrimitive = 0
    scope @5 [6:7] deps=[read $34_@4:TPrimitive, read maxItems$31_@1:TProp] {
      [6] Const mutate max$35_@5:TPrimitive = Call mutate Math$8.max(read $34_@4:TPrimitive, read maxItems$31_@1:TProp)
    }
    for (
      [8] Let mutate i$36_@2:TPrimitive[3:33] = 0
    ;
      [10] Const mutate $39_@2:TPrimitive[3:33] = Binary read i$36_@2:TPrimitive < read items$30_@0.length
      read $39_@2:TPrimitive
    ;
      [29] Const mutate $56_@2:TPrimitive[3:33] = 1
      [30] Reassign mutate i$36_@2:TPrimitive[3:33] = Binary read i$36_@2:TPrimitive + read $56_@2:TPrimitive
      read i$36_@2:TPrimitive
    ) {
      [12] Const mutate item$40_@2:TPrimitive[3:33] = Call read items$30_@0.at(read i$36_@2:TPrimitive)
      [13] Const mutate $41_@6:TPrimitive = null
      [14] Const mutate $42_@2:TPrimitive[3:33] = Binary read item$40_@2:TPrimitive == read $41_@6:TPrimitive
      [15] Let mutate $43_@2:TPrimitive[3:33] = undefined
      if (read $42_@2:TPrimitive) {
        [16] Const mutate $43_@2:TPrimitive[3:33] = read $42_@2:TPrimitive
      } else {
        [18] Const mutate $43_@2:TPrimitive[3:33] = Call mutate seen$33_@2.has(mutate item$40_@2:TPrimitive)
      }
      if (read $43_@2:TPrimitive) {
        continue
      }
      [22] Call mutate seen$33_@2.add(mutate item$40_@2:TPrimitive)
      [23] Const mutate $49_@7:TPrimitive = "div"
      scope @8 [24:25] deps=[read $49_@7:TPrimitive] {
        [24] Const mutate $50_@8 = JSX <read $49_@7:TPrimitive>{freeze item$40_@2:TPrimitive}</read $49_@7:TPrimitive>
      }
      [25] Call mutate renderedItems$32_@2.push(read $50_@8)
      [26] Const mutate $55_@9:TPrimitive = Binary read renderedItems$32_@2.length >= read max$35_@5:TPrimitive
      if (read $55_@9:TPrimitive) {
        break
      }
    }
  }
  [33] Const mutate count$66_@11:TProp = read renderedItems$32_@2.length
  [34] Const mutate $67_@12:TPrimitive = "div"
  [35] Const mutate $68_@13 = "\n      "
  [36] Const mutate $69_@14:TPrimitive = "h1"
  [37] Const mutate $70_@15 = " Items"
  scope @16 [38:39] deps=[read $69_@14:TPrimitive, freeze count$66_@11:TProp, read $70_@15] {
    [38] Const mutate $71_@16 = JSX <read $69_@14:TPrimitive>{freeze count$66_@11:TProp}{read $70_@15}</read $69_@14:TPrimitive>
  }
  [39] Const mutate $72_@17 = "\n      "
  [40] Const mutate $73_@18 = "\n    "
  scope @19 [41:42] deps=[read $67_@12:TPrimitive, read $68_@13, read $71_@16, read $72_@17, freeze renderedItems$32_@2:TFunction, read $73_@18] {
    [41] Const mutate $74_@19 = JSX <read $67_@12:TPrimitive>{read $68_@13}{read $71_@16}{read $72_@17}{freeze renderedItems$32_@2:TFunction}{read $73_@18}</read $67_@12:TPrimitive>
  }
  return read $74_@19
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
      