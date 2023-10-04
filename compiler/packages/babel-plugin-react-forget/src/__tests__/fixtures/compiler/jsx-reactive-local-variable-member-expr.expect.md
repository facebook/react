
## Input

```javascript
import * as sharedRuntime from "shared-runtime";

function Component({
  something,
}: {
  something: { StaticText1: React.ElementType };
}) {
  const Foo = something.StaticText1;
  return () => <Foo />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ something: sharedRuntime }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import * as sharedRuntime from "shared-runtime";

function Component(t13) {
  const $ = useMemoCache(2);
  const { something } = t13;

  const Foo = something.StaticText1;
  const c_0 = $[0] !== Foo;
  let t0;
  if (c_0) {
    t0 = () => <Foo />;
    $[0] = Foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ something: sharedRuntime }],
};

```
      