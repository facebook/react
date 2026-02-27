// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    async function run() {
      await fetch('...');
      setState(s => s + 1);
    }
    run();
  });
  return state;
}
