
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
function Component(props) {
  const [_state, setState] = useState();
  const a = () => {
    return b();
  };
  const b = () => {
    return (
      <>
        <div onClick={() => onClick(true)} />
        <div onClick={() => onClick(false)} />
      </>
    );
  };
  const onClick = (value) => {
    setState(value);
  };

  return <div>{a()}</div>;
}

export const FIXTURE_ENTRYPONT = {
  fn: Component,
  props: [{}],
};

```


## Error

```
   9 |       <>
  10 |         <div onClick={() => onClick(true)} />
> 11 |         <div onClick={() => onClick(false)} />
     |                             ^^^^^^^ Invariant: [InferReferenceEffects] Context variables are always mutable. (11:11)
  12 |       </>
  13 |     );
  14 |   };
```
          
      