
## Input

```javascript
import {useEffect, useState} from 'react';
import {mutate} from 'shared-runtime';

function Component(props) {
  const x = [{...props.value}];
  useEffect(() => {}, []);
  const onClick = () => {
    console.log(x.length);
  };
  let y;
  return (
    <div onClick={onClick}>
      {x.map(item => {
        y = item;
        return <span key={item.id}>{item.text}</span>;
      })}
      {mutate(y)}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: {id: 0, text: 'Hello!'}}],
  isComponent: true,
};

```


## Error

```
  12 |     <div onClick={onClick}>
  13 |       {x.map(item => {
> 14 |         y = item;
     |         ^ InvalidReact: Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead. Variable `y` cannot be reassigned after render (14:14)
  15 |         return <span key={item.id}>{item.text}</span>;
  16 |       })}
  17 |       {mutate(y)}
```
          
      