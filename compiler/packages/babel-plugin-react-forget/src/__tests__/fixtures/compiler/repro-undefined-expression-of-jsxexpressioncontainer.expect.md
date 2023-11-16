
## Input

```javascript
import { StaticText1, Stringify, Text } from "shared-runtime";

function Component(props) {
  const { buttons } = props;
  const [primaryButton, ...nonPrimaryButtons] = buttons;

  const renderedNonPrimaryButtons = nonPrimaryButtons.map((buttonProps, i) => (
    <Stringify
      {...buttonProps}
      key={`button-${i}`}
      style={
        i % 2 === 0 ? styles.leftSecondaryButton : styles.rightSecondaryButton
      }
    />
  ));

  return <StaticText1>{renderedNonPrimaryButtons}</StaticText1>;
}

const styles = {
  leftSecondaryButton: { left: true },
  rightSecondaryButton: { right: true },
};

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      buttons: [
        {},
        { type: "submit", children: ["Submit!"] },
        { type: "button", children: ["Reset"] },
      ],
    },
  ],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { StaticText1, Stringify, Text } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(7);
  const { buttons } = props;
  let nonPrimaryButtons;
  if ($[0] !== buttons) {
    const [primaryButton, ...t79] = buttons;
    nonPrimaryButtons = t79;
    $[0] = buttons;
    $[1] = nonPrimaryButtons;
  } else {
    nonPrimaryButtons = $[1];
  }
  let t1;
  if ($[2] !== nonPrimaryButtons) {
    let t0;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = (buttonProps, i) => (
        <Stringify
          {...buttonProps}
          key={`button-${i}`}
          style={
            i % 2 === 0
              ? styles.leftSecondaryButton
              : styles.rightSecondaryButton
          }
        />
      );
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    t1 = nonPrimaryButtons.map(t0);
    $[2] = nonPrimaryButtons;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const renderedNonPrimaryButtons = t1;
  let t2;
  if ($[5] !== renderedNonPrimaryButtons) {
    t2 = <StaticText1>{renderedNonPrimaryButtons}</StaticText1>;
    $[5] = renderedNonPrimaryButtons;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

const styles = {
  leftSecondaryButton: { left: true },
  rightSecondaryButton: { right: true },
};

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      buttons: [
        {},
        { type: "submit", children: ["Submit!"] },
        { type: "button", children: ["Reset"] },
      ],
    },
  ],
};

```
      
### Eval output
(kind: ok) <div>StaticText1<div>{"type":"submit","children":["Submit!"],"style":{"left":true}}</div><div>{"type":"button","children":["Reset"],"style":{"right":true}}</div></div>