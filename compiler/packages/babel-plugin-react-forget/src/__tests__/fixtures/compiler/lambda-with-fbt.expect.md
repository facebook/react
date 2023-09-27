
## Input

```javascript
import { fbt } from "fbt";

function Component() {
  const buttonLabel = () => {
    if (!someCondition) {
      return <fbt desc="My label">{"Purchase as a gift"}</fbt>;
    } else if (
      !iconOnly &&
      showPrice &&
      item?.current_gift_offer?.price?.formatted != null
    ) {
      return (
        <fbt desc="Gift button's label">
          {"Gift | "}
          <fbt:param name="price">
            {item?.current_gift_offer?.price?.formatted}
          </fbt:param>
        </fbt>
      );
    } else if (!iconOnly && !showPrice) {
      return <fbt desc="Gift button's label">{"Gift"}</fbt>;
    }
  };

  return (
    <View>
      <Button text={buttonLabel()} />
    </View>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { fbt } from "fbt";

function Component() {
  const $ = useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      if (!someCondition) {
        return fbt._("Purchase as a gift", null, { hk: "1gHj4g" });
      } else {
        if (
          !iconOnly &&
          showPrice &&
          item?.current_gift_offer?.price?.formatted != null
        ) {
          return fbt._(
            "Gift | {price}",
            [fbt._param("price", item?.current_gift_offer?.price?.formatted)],
            { hk: "3GTnGE" }
          );
        } else {
          if (!iconOnly && !showPrice) {
            return fbt._("Gift", null, { hk: "3fqfrk" });
          }
        }
      }
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const buttonLabel = t0;
  let t1;
  let t2;
  let t3;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = buttonLabel();
    t2 = <Button text={t1} />;
    t3 = <View>{t2}</View>;
    $[1] = t1;
    $[2] = t2;
    $[3] = t3;
  } else {
    t1 = $[1];
    t2 = $[2];
    t3 = $[3];
  }
  return t3;
}

```
      