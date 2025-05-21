
## Input

```javascript
import {Stringify} from 'shared-runtime';

function foo() {
  const nt = new.target;
  return <Stringify value={nt} />;
}

```


## Error

```
  2 |
  3 | function foo() {
> 4 |   const nt = new.target;
    |              ^^^^^^^^^^ Todo: (BuildHIR::lowerExpression) Handle MetaProperty expressions other than import.meta (4:4)
  5 |   return <Stringify value={nt} />;
  6 | }
  7 |
```
          
      