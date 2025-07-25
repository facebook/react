
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

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

  4 | component Example() {
  5 |   const fooRef = makeObject_Primitives();
> 6 |   fooRef.current = true;
    |   ^^^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  7 |
  8 |   return <Stringify foo={fooRef} />;
  9 | }
```
          
      