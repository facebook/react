import * as React from 'react';
import {useState} from 'react';
import {createRoot} from 'react-dom';

function createContainer() {
  const container = document.createElement('div');

  ((document.body: any): HTMLBodyElement).appendChild(container);

  return container;
}

function StatefulCounter() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount(count + 1);
  return <button onClick={handleClick}>Count {count}</button>;
}

createRoot(createContainer()).render(<StatefulCounter />);
