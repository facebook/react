
## Input

```javascript
import fbt from 'fbt';

/**
 * Currently fails with the following:
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) <div><span>Jason !</span></div>
 *   Forget:
 *   (kind: ok) <div><span>Jason!</span></div>

 */

function Foo(props) {
  return (
    // prettier-ignore
    <div>
      <fbt desc={"Dialog to show to user"}>
        <span>
          <fbt:param name="user name">
            {props.name}
          </fbt:param>
        !
        </span>
      </fbt>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{name: 'Jason'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";

/**
 * Currently fails with the following:
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) <div><span>Jason !</span></div>
 *   Forget:
 *   (kind: ok) <div><span>Jason!</span></div>

 */

function Foo(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.name) {
    t0 = (
      <div>
        {fbt._(
          "{=m0}",
          [
            fbt._implicitParam(
              "=m0",
              <span>
                {fbt._(
                  "{user name}!",
                  [
                    fbt._param(
                      "user name",

                      props.name,
                    ),
                  ],
                  { hk: "mBBZ9" },
                )}
              </span>,
            ),
          ],
          { hk: "3RVfuk" },
        )}
      </div>
    );
    $[0] = props.name;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ name: "Jason" }],
};

```
      