
## Input

```javascript
import {StaticText1, Stringify, Text} from 'shared-runtime';

function Component(props) {
  const {buttons} = props;
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
  leftSecondaryButton: {left: true},
  rightSecondaryButton: {right: true},
};

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      buttons: [
        {},
        {type: 'submit', children: ['Submit!']},
        {type: 'button', children: ['Reset']},
      ],
    },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { StaticText1, Stringify, Text } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  const { buttons } = props;
  let t0;
  if ($[0] !== buttons) {
    const [, ...nonPrimaryButtons] = buttons;

    t0 = nonPrimaryButtons.map(_temp);
    $[0] = buttons;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const renderedNonPrimaryButtons = t0;
  let t1;
  if ($[2] !== renderedNonPrimaryButtons) {
    t1 = <StaticText1>{renderedNonPrimaryButtons}</StaticText1>;
    $[2] = renderedNonPrimaryButtons;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}
function _temp(buttonProps, i) {
  return (
    <Stringify
      {...buttonProps}
      key={`button-${i}`}
      style={
        i % 2 === 0 ? styles.leftSecondaryButton : styles.rightSecondaryButton
      }
    />
  );
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