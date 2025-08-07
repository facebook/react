
## Input

```javascript
import {useState} from 'react';
import {bar} from './bar';

export const useFoot = () => {
  const [, setState] = useState(null);
  try {
    const {data} = bar();
    setState({
      data,
      error: null,
    });
  } catch (err) {
    setState(_prevState => ({
      loading: false,
      error: err,
    }));
  }
};

```


## Error

```
Found 1 error:

Invariant: Expected all references to a variable to be consistently local or context references

Identifier <unknown> err$7 is referenced as a context variable, but was previously referenced as a [object Object] variable.

error.bug-invariant-local-or-context-references.ts:15:13
  13 |     setState(_prevState => ({
  14 |       loading: false,
> 15 |       error: err,
     |              ^^^ Expected all references to a variable to be consistently local or context references
  16 |     }));
  17 |   }
  18 | };
```
          
      