
## Input

```javascript
import {makeObject_Primitives} from 'shared-runtime';

// @flow @enableTreatRefLikeIdentifiersAsRefs
component Example() {
  const fooRef = makeObject_Primitives();
  fooRef.current = true;

  return <Stringify foo={fooRef} />;
}

```


## Error

```
Missing semicolon. (4:9)
```
          
      