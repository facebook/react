import 'react';
import './App.css';
// @ts-expect-error no types
import {useTime} from 'runtime-compat-lib';

function App() {
  const time = useTime();
  return (
    <>
      <h1>React 19</h1>
      <span>Current time: {time.toLocaleString()}</span>
    </>
  );
}

export default App;
