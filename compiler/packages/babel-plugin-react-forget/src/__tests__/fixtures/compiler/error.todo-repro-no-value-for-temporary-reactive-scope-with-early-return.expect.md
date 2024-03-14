
## Input

```javascript
// @flow @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import { identity, makeObject_Primitives } from "shared-runtime";

function Component(props) {
  const object = makeObject_Primitives();
  const cond = makeObject_Primitives();
  if (!cond) {
    return null;
  }

  return (
    <div className="foo">
      {fbt(
        "Lorum ipsum" + fbt.param("thing", object.b) + " blah blah blah",
        "More text"
      )}
    </div>
  );
}

```


## Error

```
  10 |
  11 |   return (
> 12 |     <div className="foo">
     |                    ^^^^^ [ReactForget] Invariant: [Codegen] No value found for temporary. Value for 'read $40:TPrimitive' was not set in the codegen context (12:12)
  13 |       {fbt(
  14 |         "Lorum ipsum" + fbt.param("thing", object.b) + " blah blah blah",
  15 |         "More text"
```
          
      