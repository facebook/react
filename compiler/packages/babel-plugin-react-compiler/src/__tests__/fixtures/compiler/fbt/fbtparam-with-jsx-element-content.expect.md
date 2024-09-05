
## Input

```javascript
import fbt from 'fbt';

function Component({name, data, icon}) {
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
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";

function Component(t0) {
  const $ = _c(4);
  const { name, data, icon } = t0;
  let t1;
  if ($[0] !== name || $[1] !== icon || $[2] !== data) {
    t1 = (
      <Text type="body4">
        {fbt._(
          "{item author}{icon}{=m2}",
          [
            fbt._param(
              "item author",

              <Text type="h4">{name}</Text>,
            ),
            fbt._param(
              "icon",

              icon,
            ),
            fbt._implicitParam(
              "=m2",
              <Text type="h4">
                {fbt._("{item details}", [fbt._param("item details", data)], {
                  hk: "4jLfVq",
                })}
              </Text>,
            ),
          ],
          { hk: "2HLm2j" },
        )}
      </Text>
    );
    $[0] = name;
    $[1] = icon;
    $[2] = data;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      