
## Input

```javascript
import fbt from 'fbt';

function Component({a, b}) {
  return (
    <fbt desc="Description">
      <fbt:enum enum-range={['avalue1', 'avalue1']} value={a} />{' '}
      <fbt:enum enum-range={['bvalue1', 'bvalue2']} value={b} />
    </fbt>
  );
}

```


## Error

```
   5 |     <fbt desc="Description">
   6 |       <fbt:enum enum-range={['avalue1', 'avalue1']} value={a} />{' '}
>  7 |       <fbt:enum enum-range={['bvalue1', 'bvalue2']} value={b} />
     |        ^^^^^^^^ Todo: Support <fbt> tags with multiple <fbt:enum> values (7:7)
   8 |     </fbt>
   9 |   );
  10 | }
```
          
      