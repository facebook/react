
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
import { c as useMemoCache } from "react/compiler-runtime";
import { fbt } from "fbt";

function Component() {
  const $ = useMemoCache(2);
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
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (
      <View>
        <Button text={buttonLabel()} />
      </View>
    );
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      