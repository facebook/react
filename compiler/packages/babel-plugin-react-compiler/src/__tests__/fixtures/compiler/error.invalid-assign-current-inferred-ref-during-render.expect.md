
## Input

```javascript
// @flow @enableTreatRefLikeIdentifiersAsRefs @validateRefAccessDuringRender
import {makeObject_Primitives} from 'shared-runtime';

component Example() {
  const fooRef = makeObject_Primitives();
  fooRef.current = true;

  return <Stringify foo={fooRef} />;
}

```


## Error

```
Found 1 error:

Error: Mutating refs during render is not allowed

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

  4 | component Example() {
  5 |   const fooRef = makeObject_Primitives();
> 6 |   fooRef.current = true;
    |   ^^^^^^ Cannot mutate ref during render
  7 |
  8 |   return <Stringify foo={fooRef} />;
  9 | }

Refs may be mutated during render if initialized with `if (ref.current == null)`
```
          
      