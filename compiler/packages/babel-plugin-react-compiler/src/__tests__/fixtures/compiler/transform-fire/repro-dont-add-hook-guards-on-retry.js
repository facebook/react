// @flow @enableEmitHookGuards @panicThreshold:"none" @enableFire
import {useEffect, fire} from 'react';

function Component(props, useDynamicHook) {
  'use memo';
  useDynamicHook();
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
  });

  return <div>hello world</div>;
}
