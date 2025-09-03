
## Input

```javascript
import {useMemo} from 'react';

function useSession() {
  return {user: {userCode: 'ABC123'}};
}

function getDefaultFromValue(
  defaultValues: string | undefined,
  userCode: string,
) {
  return defaultValues ? `${defaultValues}-${userCode}` : userCode;
}

export function UpSertField(props: {defaultValues?: string}) {
  const {
    user: {userCode},
  } = useSession();

  const defaultValues = useMemo(
    () => getDefaultFromValue(props.defaultValues, userCode),
    [props.defaultValues, userCode],
  );

  return <div>{defaultValues}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: UpSertField,
  params: [{defaultValues: 'test'}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";

function useSession() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { user: { userCode: "ABC123" } };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function getDefaultFromValue(defaultValues, userCode) {
  return defaultValues ? `${defaultValues}-${userCode}` : userCode;
}

export function UpSertField(props) {
  const $ = _c(5);
  const { user: t0 } = useSession();
  const { userCode } = t0;
  let t1;
  if ($[0] !== props.defaultValues || $[1] !== userCode) {
    t1 = getDefaultFromValue(props.defaultValues, userCode);
    $[0] = props.defaultValues;
    $[1] = userCode;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const defaultValues = t1;
  let t2;
  if ($[3] !== defaultValues) {
    t2 = <div>{defaultValues}</div>;
    $[3] = defaultValues;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: UpSertField,
  params: [{ defaultValues: "test" }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>test-ABC123</div>