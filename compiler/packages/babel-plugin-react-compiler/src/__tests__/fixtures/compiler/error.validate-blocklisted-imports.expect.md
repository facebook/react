
## Input

```javascript
// @validateBlocklistedImports(DangerousImport)
import {foo} from 'DangerousImport';
import {useIdentity} from 'shared-runtime';

function useHook() {
  useIdentity(foo);
  return;
}

```


## Error

```
  1 | // @validateBlocklistedImports(DangerousImport)
> 2 | import {foo} from 'DangerousImport';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Todo: Bailing out due to blocklisted import. Import from module DangerousImport (2:2)
  3 | import {useIdentity} from 'shared-runtime';
  4 |
  5 | function useHook() {
```
          
      