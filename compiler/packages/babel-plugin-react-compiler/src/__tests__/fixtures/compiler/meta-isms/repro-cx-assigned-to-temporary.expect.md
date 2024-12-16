
## Input

```javascript
// @compilationMode(infer) @customMacros(cx)
import {identity} from 'shared-runtime';

const DARK = 'dark';

function Component() {
  const theme = useTheme();
  return (
    <div
      className={cx({
        'styles/light': true,
        'styles/dark': theme.getTheme() === DARK,
      })}
    />
  );
}

function cx(obj) {
  const classes = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value) {
      classes.push(key);
    }
  }
  return classes.join(' ');
}

function useTheme() {
  return {
    getTheme() {
      return DARK;
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @compilationMode(infer) @customMacros(cx)
import { identity } from "shared-runtime";

const DARK = "dark";

function Component() {
  const $ = _c(4);
  const theme = useTheme();
  let t0;
  if ($[0] !== theme) {
    t0 = cx({ "styles/light": true, "styles/dark": theme.getTheme() === DARK });
    $[0] = theme;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== t0) {
    t1 = <div className={t0} />;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

function cx(obj) {
  const classes = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value) {
      classes.push(key);
    }
  }
  return classes.join(" ");
}

function useTheme() {
  return {
    getTheme() {
      return DARK;
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div class="styles/light styles/dark"></div>