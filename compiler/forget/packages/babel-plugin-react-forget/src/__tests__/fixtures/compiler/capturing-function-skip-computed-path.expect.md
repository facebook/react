
## Input

```javascript
function StoreLandingUnseenGiftModalContainer(a) {
  const giftsSeen = { a };
  return ((gift) => (gift.id ? giftsSeen[gift.id] : false))();
}

export const FIXTURE_ENTRYPOINT = {
  fn: StoreLandingUnseenGiftModalContainer,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function StoreLandingUnseenGiftModalContainer(a) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    const giftsSeen = { a };
    t0 = ((gift) => (gift.id ? giftsSeen[gift.id] : false))();
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: StoreLandingUnseenGiftModalContainer,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      