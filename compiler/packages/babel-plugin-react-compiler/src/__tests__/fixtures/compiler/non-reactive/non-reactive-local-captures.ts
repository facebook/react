// @enableNonReactiveAnnotation @enableUseTypeAnnotations
import {useState} from 'react';

type NonReactive<T> = T;

function Component() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('world');

  const handler: NonReactive<() => void> = () => {
    console.log(count, name);
  };

  return (
    <div>
      <button onClick={handler}>Log</button>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setName('React')}>Set name</button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
