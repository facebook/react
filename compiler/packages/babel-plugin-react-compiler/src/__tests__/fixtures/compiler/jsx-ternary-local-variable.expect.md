
## Input

```javascript
import {RenderPropAsChild, StaticText1, StaticText2} from 'shared-runtime';

function Component(props: {showText1: boolean}) {
  const Foo = props.showText1 ? StaticText1 : StaticText2;

  return <RenderPropAsChild items={[() => <Foo key="0" />]} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{showText1: false}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { RenderPropAsChild, StaticText1, StaticText2 } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  const Foo = props.showText1 ? StaticText1 : StaticText2;
  let t0;
  if ($[0] !== Foo) {
    t0 = () => <Foo key="0" />;
    $[0] = Foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== t0) {
    t1 = <RenderPropAsChild items={[t0]} />;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ showText1: false }],
};

```
      
### Eval output
(kind: ok) <div>HigherOrderComponent<div>StaticText2</div></div>