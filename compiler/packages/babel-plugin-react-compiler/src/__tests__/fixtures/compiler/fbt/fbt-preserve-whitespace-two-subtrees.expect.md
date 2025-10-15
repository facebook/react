
## Input

```javascript
import fbt from 'fbt';

function Foo({name1, name2}) {
  return (
    <fbt desc="Text that is displayed when two people accepts the user's pull request.">
      <fbt:param name="user1">
        <span key={name1}>
          <b>{name1}</b>
        </span>
      </fbt:param>
      and
      <fbt:param name="user2">
        <span key={name2}>
          <b>{name2}</b>
        </span>
      </fbt:param>
      accepted your PR!
    </fbt>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{name1: 'Mike', name2: 'Jan'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";

function Foo(t0) {
  const $ = _c(7);
  const { name1, name2 } = t0;
  let t1;
  if ($[0] !== name1 || $[1] !== name2) {
    let t2;
    if ($[3] !== name1) {
      t2 = <b>{name1}</b>;
      $[3] = name1;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    let t3;
    if ($[5] !== name2) {
      t3 = <b>{name2}</b>;
      $[5] = name2;
      $[6] = t3;
    } else {
      t3 = $[6];
    }
    t1 = fbt._(
      "{user1} and {user2} accepted your PR!",
      [
        fbt._param("user1", <span key={name1}>{t2}</span>),
        fbt._param("user2", <span key={name2}>{t3}</span>),
      ],
      { hk: "2PxMie" },
    );
    $[0] = name1;
    $[1] = name2;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ name1: "Mike", name2: "Jan" }],
};

```
      
### Eval output
(kind: ok) <span><b>Mike</b></span> and <span><b>Jan</b></span> accepted your PR!