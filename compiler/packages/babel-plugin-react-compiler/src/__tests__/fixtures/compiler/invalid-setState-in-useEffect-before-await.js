// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import {useCallback, useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  const f = useCallback(async () => {
    setState(s => s + 1);
    await fetch('...');
  }, []);

  useEffect(() => {
    f();
  }, [f]);

  return state;
}
