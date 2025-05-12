
## Input

```javascript
import {ValidateMemoization} from 'shared-runtime';

const Codes = {
  en: {name: 'English'},
  ja: {name: 'Japanese'},
  ko: {name: 'Korean'},
  zh: {name: 'Chinese'},
};

function Component(a) {
  let keys;
  if (a) {
    keys = Object.keys(Codes);
  } else {
    return null;
  }
  const options = keys.map(code => {
    const country = Codes[code];
    return {
      name: country.name,
      code,
    };
  });
  return (
    <>
      <ValidateMemoization inputs={[]} output={keys} onlyCheckCompiled={true} />
      <ValidateMemoization
        inputs={[]}
        output={options}
        onlyCheckCompiled={true}
      />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: false}],
  sequentialRenders: [
    {a: false},
    {a: true},
    {a: true},
    {a: false},
    {a: true},
    {a: false},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { ValidateMemoization } from "shared-runtime";

const Codes = {
  en: { name: "English" },
  ja: { name: "Japanese" },
  ko: { name: "Korean" },
  zh: { name: "Chinese" },
};

function Component(a) {
  const $ = _c(13);
  let keys;
  let t0;
  let t1;
  if ($[0] !== a) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      if (a) {
        keys = Object.keys(Codes);
      } else {
        t1 = null;
        break bb0;
      }

      t0 = keys.map(_temp);
    }
    $[0] = a;
    $[1] = t0;
    $[2] = t1;
    $[3] = keys;
  } else {
    t0 = $[1];
    t1 = $[2];
    keys = $[3];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  const options = t0;
  let t2;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== keys) {
    t3 = (
      <ValidateMemoization inputs={t2} output={keys} onlyCheckCompiled={true} />
    );
    $[5] = keys;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = [];
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== options) {
    t5 = (
      <ValidateMemoization
        inputs={t4}
        output={options}
        onlyCheckCompiled={true}
      />
    );
    $[8] = options;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  let t6;
  if ($[10] !== t3 || $[11] !== t5) {
    t6 = (
      <>
        {t3}
        {t5}
      </>
    );
    $[10] = t3;
    $[11] = t5;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  return t6;
}
function _temp(code) {
  const country = Codes[code];
  return { name: country.name, code };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: false }],
  sequentialRenders: [
    { a: false },
    { a: true },
    { a: true },
    { a: false },
    { a: true },
    { a: false },
  ],
};

```
      