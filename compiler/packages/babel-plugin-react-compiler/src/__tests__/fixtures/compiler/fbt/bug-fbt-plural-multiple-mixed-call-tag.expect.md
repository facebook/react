
## Input

```javascript
import fbt from 'fbt';

function useFoo({apples, bananas}) {
  return (
    <div>
      <fbt desc="Comments ">
        {fbt.param('number of apples', apples)}
        {'  '}
        {fbt.plural('apple', apples)} and
        {fbt.param('number of bananas', bananas)}
        {'  '}
        {fbt.plural('banana', bananas)}
      </fbt>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{apples: 1, bananas: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";

function useFoo(t0) {
  const $ = _c(3);
  const { apples, bananas } = t0;
  let t1;
  if ($[0] !== apples || $[1] !== bananas) {
    t1 = (
      <div>
        {fbt._(
          {
            "*": {
              "*": "{number of apples} apples and {number of bananas} bananas",
            },
            _1: {
              _1: "{number of apples} apple and {number of bananas} banana",
            },
          },
          [
            fbt._plural(apples),
            fbt._plural(bananas),
            fbt._param("number of apples", apples),
            fbt._param("number of bananas", bananas),
          ],
          { hk: "2f5FtZ" },
        )}
      </div>
    );
    $[0] = apples;
    $[1] = bananas;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ apples: 1, bananas: 2 }],
};

```
      