
## Input

```javascript
import {useMemo} from 'react';

// react-hooks-deps would error on this code (complex expression in depslist),
// so Forget could bailout here
function App({text, hasDeps}) {
  const resolvedText = useMemo(
    () => {
      return text.toUpperCase();
    },
    hasDeps ? null : [text], // should be DCE'd
  );
  return resolvedText;
}

export const FIXTURE_ENTRYPOINT = {
  fn: App,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```


## Error

```
   8 |       return text.toUpperCase();
   9 |     },
> 10 |     hasDeps ? null : [text], // should be DCE'd
     |     ^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Expected the dependency list for useMemo to be an array literal (10:10)
  11 |   );
  12 |   return resolvedText;
  13 | }
```
          
      