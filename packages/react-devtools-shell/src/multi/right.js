import * as React from 'react';
import {useLayoutEffect, useRef, useState} from 'react';
import {render} from 'react-dom';

function createContainer() {
  const container = document.createElement('div');

  ((document.body: any): HTMLBodyElement).appendChild(container);

  return container;
}

function EffectWithState() {
  const [didMount, setDidMount] = useState(0);

  const renderCountRef = useRef(0);
  renderCountRef.current++;

  useLayoutEffect(() => {
    if (!didMount) {
      setDidMount(true);
    }
  }, [didMount]);

  return (
    <ul>
      <li>Rendered {renderCountRef.current} times</li>
      {didMount && <li>Mounted!</li>}
    </ul>
  );
}

render(<EffectWithState />, createContainer());
