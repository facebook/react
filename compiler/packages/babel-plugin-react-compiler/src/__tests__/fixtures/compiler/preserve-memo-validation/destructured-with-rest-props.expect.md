
## Input

```javascript
import {useMemo} from 'react';

function useTheme() {
  return {primary: '#blue', secondary: '#green'};
}

function computeStyles(
  specialProp: string | undefined,
  restProps: any,
  theme: any,
) {
  return {
    color: specialProp ? theme.primary : theme.secondary,
    ...restProps.style,
  };
}

export function SpecialButton({
  specialProp,
  ...restProps
}: {
  specialProp?: string;
  style?: Record<string, string>;
  onClick?: () => void;
}) {
  const theme = useTheme();

  const styles = useMemo(
    () => computeStyles(specialProp, restProps, theme),
    [specialProp, restProps, theme],
  );

  return (
    <button style={styles} onClick={restProps.onClick}>
      Click me
    </button>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: SpecialButton,
  params: [{specialProp: 'test', style: {fontSize: '16px'}, onClick: () => {}}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";

function useTheme() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { primary: "#blue", secondary: "#green" };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function computeStyles(specialProp, restProps, theme) {
  const $ = _c(3);

  const t0 = specialProp ? theme.primary : theme.secondary;
  let t1;
  if ($[0] !== restProps.style || $[1] !== t0) {
    t1 = { color: t0, ...restProps.style };
    $[0] = restProps.style;
    $[1] = t0;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export function SpecialButton(t0) {
  const $ = _c(3);
  const { specialProp, ...restProps } = t0;

  const theme = useTheme();

  const styles = computeStyles(specialProp, restProps, theme);
  let t1;
  if ($[0] !== restProps.onClick || $[1] !== styles) {
    t1 = (
      <button style={styles} onClick={restProps.onClick}>
        Click me
      </button>
    );
    $[0] = restProps.onClick;
    $[1] = styles;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: SpecialButton,
  params: [
    { specialProp: "test", style: { fontSize: "16px" }, onClick: () => {} },
  ],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <button style="font-size: 16px;">Click me</button>