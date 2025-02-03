// @enableFire
import {fire, useEffect} from 'react';
import {Stringify} from 'shared-runtime';

/**
 * When @enableFire is specified, retry compilation with validation passes (e.g.
 * hook usage) disabled
 */
function Component(props) {
  const foo = props => {
    console.log(props);
  };

  if (props.cond) {
    useEffect(() => {
      fire(foo(props));
    });
  }

  return <Stringify />;
}
