
## Input

```javascript
import fbt from "fbt";

function Component({ name, data, icon }) {
  return (
    <Text type="body4">
      <fbt desc="Lorem ipsum">
        <fbt:param name="item author">
          <Text type="h4">{name}</Text>
        </fbt:param>
        <fbt:param name="icon">{icon}</fbt:param>
        <Text type="h4">
          <fbt:param name="item details">{data}</fbt:param>
        </Text>
      </fbt>
    </Text>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import fbt from "fbt";

function Component(t39) {
  const $ = useMemoCache(6);
  const { name, data, icon } = t39;
  const c_0 = $[0] !== name;
  const c_1 = $[1] !== icon;
  const c_2 = $[2] !== data;
  let t0;
  if (c_0 || c_1 || c_2) {
    t0 = fbt._(
      "{item author}{icon}{=m2}",
      [
        fbt._param(
          "item author",

          <Text type="h4">{name}</Text>
        ),
        fbt._param(
          "icon",

          icon
        ),
        fbt._implicitParam(
          "=m2",
          <Text type="h4">
            {fbt._("{item details}", [fbt._param("item details", data)], {
              hk: "4jLfVq",
            })}
          </Text>
        ),
      ],
      { hk: "2HLm2j" }
    );
    $[0] = name;
    $[1] = icon;
    $[2] = data;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const c_4 = $[4] !== t0;
  let t1;
  if (c_4) {
    t1 = <Text type="body4">{t0}</Text>;
    $[4] = t0;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

```
      