// @enableChangeDetectionForDebugging
import {useState} from 'react';

function Component(props) {
  const [x, _] = useState(f(props.x));
  return <div>{x}</div>;
}
