// @flow @enableFire @panicThreshold:"none"
import {fire} from 'react';
import {print} from 'shared-runtime';

component Component(prop1, ref) {
  const foo = () => {
    console.log(prop1);
  };
  useEffect(() => {
    fire(foo(prop1));
    bar();
    fire(foo());
  });

  print(ref.current);
  return null;
}
