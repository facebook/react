
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
  [1] Const mutate items$27_@0 = read props$26.items
  [2] Const mutate maxItems$28_@1 = read props$26.maxItems
  [3] Const mutate renderedItems$29_@2[3:26] = Array []
  [4] Const mutate seen$30_@3[0:19] = New mutate Set$6_@3()
  [5] Const mutate $31_@4 = 0
  [6] Const mutate max$32_@5[0:7] = Call mutate Math$8_@5.max(read $31_@4, read maxItems$28_@1)
  [7] Goto bb1
bb1:
  predecessor blocks: bb0 bb5 bb10
  [8] If (read items$27_@0) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [9] Const mutate $34_@6 = null
  [10] Const mutate $36_@3[0:19] = Binary read item$10_@3 == read $34_@6
  [11] If (read $36_@3) then:bb8 else:bb9 fallthrough=bb7
bb8:
  predecessor blocks: bb3
  [12] Const mutate $37_@3[0:19] = read $36_@3
  [13] Goto bb7
bb9:
  predecessor blocks: bb3
  [14] Const mutate $39_@3[0:19] = Call mutate seen$30_@3.has(mutate item$10_@3)
  [15] Goto bb7
bb7:
  predecessor blocks: bb8 bb9
  $40_@3[0:19]: phi(bb8: $37_@3, bb9: $39_@3)
  [16] If (read $40_@3) then:bb5 else:bb4 fallthrough=bb4
bb5:
  predecessor blocks: bb7
  [17] Goto(Continue) bb1
bb4:
  predecessor blocks: bb7
  [18] Call mutate seen$30_@3.add(mutate item$10_@3)
  [19] Const mutate $43_@7 = "div"
  [20] Const mutate $44_@8 = JSX <read $43_@7>{read item$10_@3}</read $43_@7>
  [21] Call mutate renderedItems$29_@2.push(read $44_@8)
  [22] Const mutate $49_@2[3:26] = Binary read renderedItems$29_@2.length >= read max$32_@5
  [23] If (read $49_@2) then:bb2 else:bb10 fallthrough=bb10
bb10:
  predecessor blocks: bb4
  [24] Goto(Continue) bb1
bb2:
  predecessor blocks: bb4 bb1
  [25] Const mutate count$52_@2[3:26] = read renderedItems$29_@2.length
  [26] Const mutate $53_@9 = "div"
  [27] Const mutate $54_@10 = "\n      "
  [28] Const mutate $55_@11 = "h1"
  [29] Const mutate $56_@12 = " Items"
  [30] Const mutate $57_@13 = JSX <read $55_@11>{freeze count$52_@2}{read $56_@12}</read $55_@11>
  [31] Const mutate $58_@14 = "\n      "
  [32] Const mutate $59_@15 = "\n    "
  [33] Const mutate $60_@16 = JSX <read $53_@9>{read $54_@10}{read $57_@13}{read $58_@14}{freeze renderedItems$29_@2}{read $59_@15}</read $53_@9>
  [34] Return read $60_@16
scope0 [1:2]:
 - read props$26.items
scope1 [2:3]:
 - read props$26.maxItems
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate items$27_@0 = read props$26.items
      [2] Const mutate maxItems$28_@1 = read props$26.maxItems
      [3] Const mutate renderedItems$29_@2[3:26] = Array []
      [4] Const mutate seen$30_@3[0:19] = New mutate Set$6_@3()
      [5] Const mutate $31_@4 = 0
      [6] Const mutate max$32_@5[0:7] = Call mutate Math$8_@5.max(read $31_@4, read maxItems$28_@1)
    "]
    bb0_instrs --> bb0_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["If (read items$27_@0)"])
  end
  subgraph bb3
    bb3_instrs["
      [9] Const mutate $34_@6 = null
      [10] Const mutate $36_@3[0:19] = Binary read item$10_@3 == read $34_@6
    "]
    bb3_instrs --> bb3_terminal(["If (read $36_@3)"])
  end
  subgraph bb8
    bb8_instrs["
      [12] Const mutate $37_@3[0:19] = read $36_@3
    "]
    bb8_instrs --> bb8_terminal(["Goto"])
  end
  subgraph bb9
    bb9_instrs["
      [14] Const mutate $39_@3[0:19] = Call mutate seen$30_@3.has(mutate item$10_@3)
    "]
    bb9_instrs --> bb9_terminal(["Goto"])
  end
  subgraph bb7
    bb7_terminal(["If (read $40_@3)"])
  end
  subgraph bb5
    bb5_terminal(["Goto"])
  end
  subgraph bb4
    bb4_instrs["
      [18] Call mutate seen$30_@3.add(mutate item$10_@3)
      [19] Const mutate $43_@7 = 'div'
      [20] Const mutate $44_@8 = JSX <read $43_@7>{read item$10_@3}</read $43_@7>
      [21] Call mutate renderedItems$29_@2.push(read $44_@8)
      [22] Const mutate $49_@2[3:26] = Binary read renderedItems$29_@2.length >= read max$32_@5
    "]
    bb4_instrs --> bb4_terminal(["If (read $49_@2)"])
  end
  subgraph bb10
    bb10_terminal(["Goto"])
  end
  subgraph bb2
    bb2_instrs["
      [25] Const mutate count$52_@2[3:26] = read renderedItems$29_@2.length
      [26] Const mutate $53_@9 = 'div'
      [27] Const mutate $54_@10 = '\n      '
      [28] Const mutate $55_@11 = 'h1'
      [29] Const mutate $56_@12 = ' Items'
      [30] Const mutate $57_@13 = JSX <read $55_@11>{freeze count$52_@2}{read $56_@12}</read $55_@11>
      [31] Const mutate $58_@14 = '\n      '
      [32] Const mutate $59_@15 = '\n    '
      [33] Const mutate $60_@16 = JSX <read $53_@9>{read $54_@10}{read $57_@13}{read $58_@14}{freeze renderedItems$29_@2}{read $59_@15}</read $53_@9>
    "]
    bb2_instrs --> bb2_terminal(["Return read $60_@16"])
  end

  %% Jumps
  bb0_terminal --> bb1
  bb1_terminal -- "then" --> bb3
  bb1_terminal -- "else" --> bb2
  bb3_terminal -- "then" --> bb8
  bb3_terminal -- "else" --> bb9
  bb3_terminal -- "fallthrough" --> bb7
  bb8_terminal --> bb7
  bb9_terminal --> bb7
  bb7_terminal -- "then" --> bb5
  bb7_terminal -- "else" --> bb4
  bb5_terminal --> bb1
  bb4_terminal -- "then" --> bb2
  bb4_terminal -- "else" --> bb10
  bb10_terminal --> bb1

```

## Code

```javascript
function Component$0(props$26) {
  const items$27 = props$26.items;
  const maxItems$28 = props$26.maxItems;
  const renderedItems$29 = [];
  const seen$30 = new Set$6();
  const max$32 = Math$8.max(0, maxItems$28);
}

```
      