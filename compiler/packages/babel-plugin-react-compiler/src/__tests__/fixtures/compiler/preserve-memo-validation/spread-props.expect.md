
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

export function UpSertField({...props}: {defaultValues?: string}) {
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

export function UpSertField(t0) {
  const $ = _c(7);
  let props;
  if ($[0] !== t0) {
    ({ ...props } = t0);
    $[0] = t0;
    $[1] = props;
  } else {
    props = $[1];
  }
  const { user: t1 } = useSession();
  const { userCode } = t1;
  let t2;
  if ($[2] !== props.defaultValues || $[3] !== userCode) {
    t2 = getDefaultFromValue(props.defaultValues, userCode);
    $[2] = props.defaultValues;
    $[3] = userCode;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const defaultValues = t2;
  let t3;
  if ($[5] !== defaultValues) {
    t3 = <div>{defaultValues}</div>;
    $[5] = defaultValues;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: UpSertField,
  params: [{ defaultValues: "test" }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>test-ABC123</div>