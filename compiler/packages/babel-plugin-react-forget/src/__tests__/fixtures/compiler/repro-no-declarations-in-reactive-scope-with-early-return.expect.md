
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
function Component() {
  const items = useItems();
  const filteredItems = useMemo(
    () =>
      items.filter(([item]) => {
        return item.name != null;
      }),
    [item]
  );

  if (filteredItems.length === 0) {
    // note: this must return nested JSX to create the right scope
    // shape that causes no declarations to be emitted
    return (
      <div>
        <span />
      </div>
    );
  }

  return (
    <>
      {filteredItems.map(([item]) => (
        <Stringify item={item} />
      ))}
    </>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
function Component() {
  const $ = useMemoCache(9);
  const items = useItems();
  let t0;
  let t1;
  let t2;
  if ($[0] !== items) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb14: {
      let t3;
      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = (t4) => {
          const [item] = t4;
          return item.name != null;
        };
        $[4] = t3;
      } else {
        t3 = $[4];
      }
      t0 = items.filter(t3);
      const filteredItems = t0;
      if (filteredItems.length === 0) {
        let t4;
        if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
          t4 = (
            <div>
              <span />
            </div>
          );
          $[5] = t4;
        } else {
          t4 = $[5];
        }
        t2 = t4;
        break bb14;
      }
      let t4;
      if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = (t5) => {
          const [item_0] = t5;
          return <Stringify item={item_0} />;
        };
        $[6] = t4;
      } else {
        t4 = $[6];
      }
      t1 = filteredItems.map(t4);
    }
    $[0] = items;
    $[1] = t1;
    $[2] = t2;
    $[3] = t0;
  } else {
    t1 = $[1];
    t2 = $[2];
    t0 = $[3];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  let t3;
  if ($[7] !== t1) {
    t3 = <>{t1}</>;
    $[7] = t1;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented