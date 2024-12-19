// @enableFire
import {fire, useEffect} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };

  if (props.cond) {
    useEffect(() => {
      fire(foo(props));
    });
  }

  return null;
}
